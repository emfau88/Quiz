"""Two-stage local export for the German culture desk. Network research is separate."""
import argparse
import datetime
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse


BASE = Path(__file__).resolve().parents[1] / "content" / "culture"
ACTOR = "Codex · Redaktion Geschichte, Unterhaltung und Kultur"
CATEGORIES = {"history_discoveries", "entertainment", "language_culture"}


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def stamp(at):
    return dict(actor_type="agent", actor=ACTOR, at=at, source_ids=["s1"],
                content_revision=1, semantic_revision=1, result="pass")


def dump(path, obj):
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def rows(batch):
    return [json.loads(line) for line in (BASE/"work"/f"{batch}.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]


def inspect(batch):
    draft = rows(batch)
    claims = set()
    record = {}
    for item in draft:
        assert item["category"] in CATEGORIES
        assert item["difficulty"] in ("easy", "medium", "hard")
        assert item["fact_key"] not in claims and re.fullmatch(r"[a-z0-9_.-]+", item["fact_key"]), item
        claims.add(item["fact_key"])
        assert len({s.strip().casefold() for s in item["choices"]}) == 4
        assert len(item["choices"]) == 4 and all(s and len(s) <= 80 for s in item["choices"])
        assert 5 <= len(item["question"]) <= 180 and 5 <= len(item["explanation"]) <= 320
        assert urlparse(item["url"]).scheme == "https"
        datetime.datetime.fromisoformat(item["checked_at"])
        record[item["fact_key"]] = dict(fingerprint=digest(item), at=now())
        print(f'{item["category"][:3]} {item["difficulty"][0]} | {item["question"]} | {" / ".join(item["choices"])} | {item["explanation"]}')
    dump(BASE/"evidence"/f"{batch}-facts.json",record)


def approve(batch):
    checked = json.loads((BASE/"evidence"/f"{batch}-facts.json").read_text(encoding="utf-8"))
    out = []
    for item in rows(batch):
        fact = checked[item["fact_key"]]
        assert fact["fingerprint"] == digest(item), "Redaktionelle Fassung nach Faktenprüfung geändert"
        slug = item["fact_key"].replace(".", "-").replace("_","-")
        at = now()
        out.append(dict(id="k-"+slug, fact_key=item["fact_key"], category=item["category"],
            difficulty=item["difficulty"],question=item["question"],
            options=[dict(id=chr(97+i),text=x) for i,x in enumerate(item["choices"])],correct_option_id="a",
            explanation=item["explanation"],tags=item.get("tags",[]),content_revision=1,semantic_revision=1,
            valid_until=None,status="release_approved",sources=[dict(id="s1",title=item["title"],url=item["url"],
                verified_claim=item.get("claim",item["explanation"]),checked_at=item["checked_at"])],
            review=dict(fact=stamp(fact["at"]),editorial=stamp(at),approved_at=at,approved_by=ACTOR,issues=[],length_exception=None),
            human_test_observations=[],reference=item.get("reference",False),starter=item.get("starter",False)))
    dump(BASE/f"{batch}.json",out)
    print(f"{len(out)} Einträge gespeichert: {batch}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("batch")
    parser.add_argument("action", choices=["inspect","approve"])
    args = parser.parse_args()
    {"inspect":inspect,"approve":approve}[args.action](args.batch)
