"""Source and release checks for the 0.3 history and entertainment desk."""
import argparse
from collections import Counter
from datetime import datetime, timezone
from functools import lru_cache
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import unicodedata
from xml.etree import ElementTree

from jsonschema import Draft202012Validator, FormatChecker

from catalog import normalize, read, verify, verify_classification

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "content/culture"
WORK = BASE / "work/03"
PROOFS = BASE / "evidence/03"
LEVELS = {"e": "easy", "m": "medium", "h": "hard"}
FORMS = {"h": "herleiten", "s": "schaetzen", "v": "vergleichen", "z": "zeitlich_einordnen", "a": "anwenden"}
CATEGORIES = {"h": "history_discoveries", "e": "entertainment"}
ACTOR = "Codex · Redaktion Geschichte und Unterhaltung"


def stamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def canonical(text):
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


@lru_cache(maxsize=256)
def document(identifier):
    from culture_fetch import CACHE as LEGACY
    from culture_read import text_rows
    from pypdf import PdfReader

    key, _, part = identifier.partition("/")
    entries = read(WORK / "quellen.json") if (WORK / "quellen.json").exists() else {}
    if key in entries:
        title, url = entries[key]
        path = ROOT / ".cache" / ("culture03-" + key + ".raw")
        raw = path.read_bytes()
        fetched = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(timespec="seconds")
    else:
        meta = read(BASE / "evidence/retrievals.json")[key]
        title, url, fetched = meta["title"], meta["url"], meta["at"]
        raw = (LEGACY / key).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == meta["sha256"], key
    if key == "whc" and part:
        record = next(e for e in ElementTree.fromstring(raw).findall(".//row") if e.findtext("id_number") == part)
        title += " · " + record.findtext("site")
        lines = [re.sub("<[^>]+>", "", record.findtext(k) or "")
                 for k in ("site", "states", "date_inscribed", "short_description")]
    elif raw[:4] == b"%PDF":
        lines = [line.strip() for p in PdfReader(BytesIO(raw)).pages for line in (p.extract_text() or "").splitlines() if line.strip()]
    else:
        lines = list(text_rows(key, raw))
    return title, url, fetched, hashlib.sha256(raw).hexdigest(), lines


def article_cards(batch):
    result = []
    topic = None
    for line in (WORK / (batch + ".cards")).read_text(encoding="utf-8").splitlines():
        if line.startswith("@"):
            topic = line[1:].strip()
            continue
        if not line.strip() or line.startswith("#"):
            continue
        key, evidence, labels, question, choices, explanation = line.split("|")
        diff, form = labels
        options = choices.split("^")
        assert topic and re.fullmatch(r"[a-z0-9_]+", topic), topic
        assert len(options) == len(set(map(normalize, options))) == 4, key
        assert len(question) <= 180 and len(explanation) <= 320 and max(map(len, options)) <= 80, key
        assert question.endswith("?") and len(explanation) >= 15, key
        assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key), key
        result.append(dict(id="q3-" + batch[0] + "-" + key, fact_key="q3." + batch[0] + "." + key.replace("-", "."),
                           category=CATEGORIES[batch[0]], difficulty=LEVELS[diff], form=FORMS[form], topic=topic,
                           question=question, choices=options, explanation=explanation, evidence=evidence))
    return result


def gather(draft):
    evidence = []
    for token in draft["evidence"].split("~"):
        key, anchor = token.split(":", 1)
        title, url, fetched, sha, lines = document(key)
        check = canonical(anchor)
        numbered = [(n, line) for n, line in enumerate(lines, start=1) if check in canonical(line)]
        if not numbered and check in canonical(" ".join(lines)):
            for n in range(len(lines)):
                merged = " ".join(lines[n:n + 4])
                if check in canonical(merged):
                    numbered = [(n + 1, merged)]
                    break
        if not numbered:
            raise ValueError(f"{draft['id']}: Belegstelle '{anchor}' fehlt in {key}")
        line_no, line = numbered[0]
        if len(numbered) > 1:
            line_no, line = max(numbered, key=lambda pair: len(pair[1]))
        evidence.append(dict(key=key, title=title, url=url, downloaded_at=fetched, sha256=sha, source_line=line_no,
                             source_line_sha256=hashlib.sha256(line.encode()).hexdigest(), anchor=anchor))
    return evidence


def facts(batch):
    records = {}
    errors = []
    for draft in article_cards(batch):
        try:
            proof = gather(draft)
        except (ValueError, KeyError, OSError) as exc:
            errors.append(str(exc))
            continue
        records[draft["id"]] = dict(fingerprint=digest(draft), checked_at=stamp(), sources=proof)
    if errors:
        raise ValueError("\n".join(errors))
    save(PROOFS / (batch + "-fakten.json"), records)
    print(f"{batch}: {len(records)} Fassungen mit tatsächlichen Belegstellen geprüft.")


def review(batch):
    records = read(PROOFS / (batch + "-fakten.json"))
    for d in article_cards(batch):
        rec = records[d["id"]]
        assert rec["fingerprint"] == digest(d)
        print(f'{d["id"]} {d["difficulty"]} {d["form"]} | {d["question"]} | {" / ".join(d["choices"])} | {d["explanation"]}')


def approve(batch):
    drafts = article_cards(batch)
    records = read(PROOFS / (batch + "-fakten.json"))
    result = []
    validator = Draft202012Validator(read(ROOT / "specs/question.schema.json"), format_checker=FormatChecker())
    for i, d in enumerate(drafts):
        rec = records[d["id"]]
        if rec["fingerprint"] != digest(d):
            raise ValueError("Text seit Quellenkontrolle verändert: " + d["id"])
        sources = []
        for j, r in enumerate(rec["sources"], start=1):
            sources.append(dict(id=f"s{j}", title=r["title"], url=r["url"], checked_at=rec["checked_at"],
                                verified_claim=d["question"] + " " + d["choices"][0].rstrip(".") + ". " + d["explanation"],
                                locator=f'{r["key"]}, Textstelle {r["source_line"]}', source_sha256=r["sha256"]))
        when = stamp()
        check = dict(actor_type="agent", actor=ACTOR, source_ids=[s["id"] for s in sources], content_revision=1, semantic_revision=1, result="pass")
        rotation = i % 4
        opts = d["choices"][-rotation:] + d["choices"][:-rotation] if rotation else d["choices"]
        q = dict(id=d["id"], fact_key=d["fact_key"], category=d["category"], difficulty=d["difficulty"],
                 question=d["question"], options=[dict(id="abcd"[j], text=x) for j, x in enumerate(opts)],
                 correct_option_id="abcd"[rotation], explanation=d["explanation"],
                 tags=["thema_" + d["topic"], "form_" + d["form"]] + (["tagesraetsel"] if d["form"] == "herleiten" else []),
                 content_revision=1, semantic_revision=1,
                 valid_until=None, status="release_approved", sources=sources,
                 review=dict(fact={**check,"at":rec["checked_at"]}, editorial={**check,"at":when}, approved_at=when,
                             approved_by=ACTOR, issues=[], length_exception=None), human_test_observations=[], reference=False, starter=False)
        verify(q, validator)
        result.append(q)
    save(BASE / ("03-" + batch + ".json"), result)
    print(f"{len(result)} abgenommene Fragen in 03-{batch}.json.")


def audit():
    """Reconcile releases with both the authored drafts and their recorded source checks."""
    validator = Draft202012Validator(read(ROOT / "specs/question.schema.json"), format_checker=FormatChecker())
    report = {"checked_at": stamp(), "files": {}, "categories": {}}
    definitions = {}
    source_keys = set()
    urls = set()
    factual_times = []
    editorial_times = []
    for path in sorted(WORK.glob("*.cards")):
        batch = path.stem
        rows = read(BASE / ("03-" + batch + ".json"))
        facts_by_id = read(PROOFS / (batch + "-fakten.json"))
        drafts = article_cards(batch)
        assert len(rows) == len(drafts) == len(facts_by_id), batch
        for draft, row in zip(drafts, rows):
            identifier = row["id"]
            checked = facts_by_id[identifier]
            assert identifier == draft["id"] and checked["fingerprint"] == digest(draft), identifier
            assert row["question"] == draft["question"] and row["explanation"] == draft["explanation"], identifier
            assert sorted(opt["text"] for opt in row["options"]) == sorted(draft["choices"]), identifier
            assert next(opt["text"] for opt in row["options"] if opt["id"] == row["correct_option_id"]) == draft["choices"][0], identifier
            verify(row, validator)
            verify_classification(row)
            assert row["status"] == "release_approved" and not row["human_test_observations"], identifier
            assert row["review"]["fact"]["at"] == checked["checked_at"], identifier
            assert len(checked["sources"]) == len(row["sources"]), identifier
            for proof, source in zip(checked["sources"], row["sources"]):
                assert proof["sha256"] == source["source_sha256"] and proof["url"] == source["url"], identifier
                source_keys.add(proof["key"])
                urls.add(source["url"])
            assert identifier not in definitions, identifier
            definitions[identifier] = row
            factual_times.append(row["review"]["fact"]["at"])
            editorial_times.append(row["review"]["editorial"]["at"])
        report["files"][batch] = {"count": len(rows), "content_sha256": digest(rows)}
    for field in ("fact_key", "question", "explanation"):
        assert len({normalize(row[field]) for row in definitions.values()}) == len(definitions), field
    for category in CATEGORIES.values():
        rows = [row for row in definitions.values() if row["category"] == category]
        levels = Counter(row["difficulty"] for row in rows)
        tags = Counter(tag for row in rows for tag in row["tags"])
        forms = {key[5:]: count for key, count in sorted(tags.items()) if key.startswith("form_")}
        assert levels == {"easy": 176, "medium": 88, "hard": 30}, category
        assert forms["schaetzen"] >= 28 and forms["herleiten"] >= 50, category
        assert set(forms) == set(FORMS.values()), category
        report["categories"][category] = dict(count=len(rows), difficulties=dict(levels), forms=forms,
            topics={key[6:]: count for key, count in sorted(tags.items()) if key.startswith("thema_")},
            tagesraetsel=tags["tagesraetsel"])
    report.update(count=len(definitions), source_keys=len(source_keys), distinct_source_urls=len(urls),
                  factual_review_utc=[min(factual_times), max(factual_times)],
                  editorial_release_utc=[min(editorial_times), max(editorial_times)])
    save(PROOFS / "abnahme.json", report)
    print(json.dumps({key: value["forms"] for key, value in report["categories"].items()}, ensure_ascii=False))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("action", choices=("read", "facts", "review", "approve", "audit"))
    p.add_argument("keys", nargs="*")
    p.add_argument("--filter", default=".")
    p.add_argument("--limit", type=int, default=30)
    p.add_argument("--width", type=int, default=400)
    args = p.parse_args()
    if args.action == "audit":
        audit()
    elif not args.keys:
        p.error("Mindestens eine Quelle oder eine Charge angeben.")
    for key in args.keys:
        if args.action == "read":
            t, u, at, _, lines = document(key)
            print(key, t, u)
            hits = ((i, s) for i, s in enumerate(lines, 1) if re.search(args.filter, s, re.I))
            for _, (i, s) in zip(range(args.limit), hits):
                print(f"{i} {s[:args.width]}")
        else:
            {"facts":facts,"review":review,"approve":approve}[args.action](key)
