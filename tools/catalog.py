"""Validate the editorial record and compile a reproducible offline catalog."""
import argparse
from collections import Counter
from datetime import date, datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import unicodedata

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web/data"
LEVELS = ("easy", "medium", "hard")
RUNTIME_FIELDS = ("id", "fact_key", "category", "difficulty", "question", "options",
                  "correct_option_id", "explanation", "tags", "content_revision",
                  "semantic_revision", "valid_until")


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def normalize(value):
    return " ".join(re.findall(r"\w+", unicodedata.normalize("NFKC", value).casefold()))


def require(ok, message):
    if not ok:
        raise ValueError(message)


def unique(values, message):
    require(len(set(values)) == len(values), message)


def verify(q, validator):
    validator.validate(q)
    options = q["options"]
    sources = q["sources"]
    ids = [o["id"] for o in options]
    unique(ids, "doppelte Antwort-ID")
    unique([normalize(o["text"]) for o in options], "gleiche Antworttexte")
    require(q["correct_option_id"] in ids, "ungültiger Antwortschlüssel")
    unique([s["id"] for s in sources], "doppelte Quellen-ID")
    for text in [q["id"], q["fact_key"], q["question"], q["explanation"],
                 *ids, *(o["text"] for o in options),
                 *(s[k] for s in sources for k in ("id", "title", "verified_claim"))]:
        require(text.strip(), "leerer Text")
    require(q["semantic_revision"] <= q["content_revision"], "semantische Revision größer als Inhaltsrevision")
    if q["status"] != "release_approved":
        return
    review = q["review"]
    require(sources and not review["issues"], "Prüfprobleme oder fehlende Quelle")
    excess = len(q["question"]) > 180 or len(q["explanation"]) > 320 or any(len(o["text"]) > 80 for o in options)
    require(not excess or review.get("length_exception"), "unbelegte Längenausnahme")
    available = {s["id"]: s for s in sources}
    timestamps = []
    for step in ("fact", "editorial"):
        p = review[step]
        require(p["result"] == "pass" and p["actor"].strip(), "fehlende positive Prüfung")
        require(all(p[k] == q[k] for k in ("content_revision", "semantic_revision")), "veraltete Prüfung")
        require(set(p["source_ids"]) <= set(available), "ungültiger Quellenverweis")
        when = datetime.fromisoformat(p["at"])
        require(all(datetime.fromisoformat(available[s]["checked_at"]) <= when for s in p["source_ids"]), "Abruf nach Prüfung")
        timestamps.append(when)
    approved = datetime.fromisoformat(review["approved_at"])
    require(timestamps[0] <= timestamps[1] <= approved <= datetime.now(timezone.utc), "ungültige Prüfreihenfolge")
    require(review["approved_by"].strip(), "Freigabeverantwortlicher fehlt")


def distribution(rows, categories):
    grouped = Counter((q["category"], q["difficulty"]) for q in rows)
    return {c: [grouped[c, d] for d in LEVELS] for c in categories}


def revision_stamp(entry):
    answers = [entry["fact_key"], entry["correct_option_id"], sorted(o["id"] for o in entry["options"])]
    return {"revision": entry["content_revision"], "semantic_revision": entry["semantic_revision"],
            "sha256": hashlib.sha256(encode(entry).encode()).hexdigest(),
            "answer_sha256": hashlib.sha256(encode(answers).encode()).hexdigest()}


def check_history(entry, old):
    current = revision_stamp(entry)
    require(current["revision"] >= old["revision"] and current["semantic_revision"] >= old["semantic_revision"],
            f"Revision zurückgesetzt: {entry['id']}")
    require(current["revision"] > old["revision"] or current["sha256"] == old["sha256"],
            f"Inhalt ohne Revisionswechsel: {entry['id']}")
    if "answer_sha256" in old and current["answer_sha256"] != old["answer_sha256"]:
        require(current["semantic_revision"] > old["semantic_revision"],
                f"Geänderter Sachverhalt oder Antwortschlüssel ohne neue semantische Revision: {entry['id']}")


def public_corrections(records):
    entries = []
    for row in records:
        revision = row["semantic_revision"]
        require(type(revision) is int and revision > 0, "ungültige zurückgezogene semantische Revision")
        for key in ("id", "reason"):
            require(isinstance(row[key], str) and row[key].strip(), f"Rückzugsfeld {key} fehlt")
        entry = {key: row[key] for key in ("id", "semantic_revision", "reason")}
        if row.get("replacement_id") is not None:
            require(isinstance(row["replacement_id"], str) and row["replacement_id"].strip(), "leere Ersatz-ID")
            entry["replacement_id"] = row["replacement_id"]
        entries.append(entry)
    unique([(r["id"], r["semantic_revision"]) for r in entries], "doppelter Rückzug")
    return entries


def editorial_archive(records, replacements):
    """Keep factual withdrawals and ordinary editorial rotation independent."""
    by_id = {q["id"]: q for q in records}
    unique([r["old_id"] for r in replacements], "Karte mehrfach ausgetauscht")
    unique([r["new_id"] for r in replacements], "Ersatzkarte mehrfach verplant")
    following = {r["old_id"]: r["new_id"] for r in replacements}
    for pair in replacements:
        old, new = by_id.get(pair["old_id"]), by_id.get(pair["new_id"])
        require(old and new, f"Unbekannte Austausch-ID: {pair}")
        require(not old.get("reference") and not old.get("starter"), f"Referenzkarte im Archiv: {old['id']}")
        require(old["category"] == new["category"] and old["fact_key"] != new["fact_key"],
                f"Unpassender Austausch: {old['id']}")
        require(isinstance(pair["reason"], str) and pair["reason"].strip(), "Austauschgrund fehlt")
        chain, current = set(), old["id"]
        while current in following:
            require(current not in chain, f"Zyklische Austauschliste: {current}")
            chain.add(current)
            current = following[current]
    return [{"id": qid, "semantic_revision": by_id[qid]["semantic_revision"]} for qid in sorted(following)]


FORMS = {"form_wiedererkennen", "form_herleiten", "form_vergleichen", "form_zeitlich_einordnen",
         "form_schaetzen", "form_anwenden"}


def verify_classification(q):
    topics = [t for t in q["tags"] if t.startswith("thema_")]
    forms = [t for t in q["tags"] if t.startswith("form_")]
    require(len(topics) == 1 and re.fullmatch(r"thema_[a-z][a-z0-9_]*", topics[0]),
            f"Genau ein Hauptunterthema erforderlich: {q['id']}")
    require(len(forms) == 1 and forms[0] in FORMS, f"Genau eine bekannte Frageform erforderlich: {q['id']}")
    if "tagesraetsel" in q["tags"]:
        require(forms == ["form_herleiten"], f"Hinweisfrage in falscher Frageform: {q['id']}")
    if "research" in q:
        research = q["research"]
        when = date.fromisoformat(research["published_on"])
        require(when <= date.today() and any(s["id"] == research["source_id"] for s in q["sources"]),
                f"Publikationsdatum oder Originalquelle der Forschungskarte ungültig: {q['id']}")


def build(stage, output, as_of, rules_path=None):
    rules = read(ROOT / "specs/product_rules.json")
    schema = read(ROOT / "specs/question.schema.json")
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    sources = sorted((ROOT / "content").glob("*/*.json"))
    all_rows = []
    for path in sources:
        batch = read(path)
        for q in batch:
            try:
                verify(q, validator)
            except Exception as e:
                raise ValueError(f"{path.name} / {q.get('id', '?')}: {e}") from e
        all_rows.extend(batch)
    unique([q["id"] for q in all_rows], "doppelte redaktionelle Frage-ID")
    replacements = [pair for path in sorted((ROOT / "content/rotation").glob("*/*.json")) for pair in read(path)]
    archived = editorial_archive(all_rows, replacements)
    archived_ids = {row["id"] for row in archived}
    corrections = public_corrections(read(ROOT / "content/corrections.json"))
    blocked = {(c["id"], c["semantic_revision"]) for c in corrections}
    require(all((q["id"], q["semantic_revision"]) in blocked for q in all_rows if q["status"] == "retired"), "Rückzug ohne Sperrvermerk")
    approved = [q for q in all_rows if q["status"] == "release_approved" and q["id"] not in archived_ids
                and (q["id"], q["semantic_revision"]) not in blocked
                and (not q["valid_until"] or q["valid_until"] >= as_of)]
    rows = sorted((q for q in approved if stage not in ("starter", "reference") or q.get(stage)), key=lambda q: q["id"])
    if stage == "half":
        subset = []
        for c in rules["categories"]:
            for difficulty, needed in zip(LEVELS, [60, 30, 10]):
                pool = sorted((q for q in rows if q["category"] == c and q["difficulty"] == difficulty),
                              key=lambda q: (not q.get("reference", False), q["id"]))
                require(len(pool) >= needed, f"600er-Mischung noch offen: {c}/{difficulty} {len(pool)} von {needed}")
                subset.extend(pool[:needed])
        rows = sorted(subset, key=lambda q: q["id"])
    unique([normalize(q["fact_key"]) for q in rows], "doppelter aktiver Sachverhalt")
    unique([normalize(q["question"]) for q in rows], "gleichlautender Fragetext")
    mix = distribution(rows, rules["categories"])
    reference = distribution([q for q in rows if q.get("reference")], rules["categories"])
    exact_reference = all(v == rules["catalog"]["reference_mix"] for v in reference.values())
    exact_release = all(v == rules["catalog"]["release_mix"] for v in mix.values())
    if stage in ("reference", "half", "release"):
        require(exact_reference, f"Referenzverteilung unvollständig: {reference}")
    if stage == "release":
        require(all("tagesraetsel" in q["tags"] for q in rows if "form_herleiten" in q["tags"]),
                "Als Herleitung eingeordnete Frage ohne redaktionelle Eignungsprüfung für die Tagesrunde")
        require(exact_release, f"Releaseverteilung unvollständig: {mix}")
    require(len(rows) >= rules["catalog"]["starter_min"], "Mindestens 20 belegte Fragen erforderlich")
    require(all(sum(v) > 0 for v in mix.values()), "Eine Kategorie fehlt")
    history_file = ROOT / "specs/revision-history.json"
    history = read(history_file) if history_file.exists() else {}
    runtime = []
    for q in rows:
        verify_classification(q)
        entry = {k: q[k] for k in RUNTIME_FIELDS}
        entry["sources"] = [{k: s[k] for k in ("title", "url")} for s in q["sources"]]
        if "research" in q:
            record = q["research"]
            original = next(s for s in q["sources"] if s["id"] == record["source_id"])
            entry["research"] = {"published_on": record["published_on"], "publisher": record["publisher"],
                                 "url": original["url"]}
        old = history.get(q["id"])
        if old:
            check_history(entry, old)
        runtime.append(entry)
    listed_clues = read(ROOT / "specs/daily_clues.json")
    clue_ids = [qid for roster in listed_clues.values() for qid in roster]
    unique(clue_ids, "Doppelte ID in der täglichen Hinweisauswahl")
    qualified = {q["id"] for q in rows if "tagesraetsel" in q["tags"] and q["id"] in listed_clues.get(q["category"], [])}
    if stage == "release":
        require(set(listed_clues) == set(rules["categories"]) and set(clue_ids) == qualified,
                "Unbekannte, falsch zugeordnete oder ungeprüfte Frage in der täglichen Hinweisauswahl")
    daily_clues = sorted(qualified)
    forms = Counter(next(t for t in q["tags"] if t.startswith("form_")) for q in rows)
    if stage == "release":
        require(forms["form_wiedererkennen"] <= len(rows) * rules["catalog"]["max_recognition_share"],
                "Anteil reiner Wiedererkennungsfragen über dem vereinbarten Maximum")
        for form, count in rules["rounds"]["daily"]["formats"].items():
            require(forms[form] >= count, f"Pflichtformat zu schwach besetzt: {form}")
        require(any("research" in q for q in rows), "Forschungskarten fehlen")
    daily = rules["rounds"]["daily"]
    slots = daily["formats"]
    available = Counter(next(t for t in q["tags"] if t.startswith("form_")) for q in rows if "research" not in q)
    available["form_wiedererkennen"] = min(available["form_wiedererkennen"], daily["max_recognition"])
    daily_formats = (all(available[k] >= n for k, n in slots.items())
                     and sum(n for k, n in available.items() if k not in slots) >= daily["length"] - sum(slots.values()))
    if stage == "release":
        require(daily_formats, "Pflichtplätze einer Tagesrunde ohne Forschung nicht belegbar")
    content_hash = hashlib.sha256(encode([runtime, corrections, archived, daily_formats, daily_clues]).encode()).hexdigest()
    version = "de-" + content_hash[:12]
    manifest = {"version": version, "sha256": content_hash, "active": len(rows), "facts": len({q["fact_key"] for q in rows}),
                "starter": sum(bool(q.get("starter")) for q in rows), "reference": sum(bool(q.get("reference")) for q in rows),
                "categories": mix, "reference_categories": reference, "reference_complete": exact_reference,
                "release_distribution_complete": exact_reference and exact_release, "corrections": len(corrections),
                "archived": len(archived), "forms": dict(sorted(forms.items())),
                "research": sum("research" in q for q in rows), "daily_formats": daily_formats, "daily_clues": len(daily_clues),
                "human_observations": sum(len(q["human_test_observations"]) for q in rows)}
    output.mkdir(parents=True, exist_ok=True)
    (output / "catalog.json").write_text(encode({"version": version, "questions": runtime, "corrections": corrections,
                                                "archived": archived, "daily_formats": daily_formats,
                                                "daily_clues": daily_clues}) + "\n", encoding="utf-8", newline="\n")
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    rules_path = rules_path or (output.parent / "js/rules.js")
    rules_path.parent.mkdir(parents=True, exist_ok=True)
    rules_path.write_text("// Generated from specs/product_rules.json.\nexport const RULES = " + json.dumps(rules, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=["starter", "reference", "half", "batch", "release"], default="batch")
    parser.add_argument("--output", type=Path, default=DATA)
    parser.add_argument("--rules-output", type=Path, help="optional output path for generated rules.js")
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    parser.add_argument("--record-history", action="store_true", help="record hashes after editorial acceptance")
    args = parser.parse_args()
    try:
        result = build(args.stage, args.output, args.as_of.isoformat(), args.rules_output)
        if args.record_history:
            history_path = ROOT / "specs/revision-history.json"
            history = read(history_path) if history_path.exists() else {}
            for entry in read(args.output / "catalog.json")["questions"]:
                history[entry["id"]] = revision_stamp(entry)
            history_path.write_text(json.dumps(history, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
        print(f"{result['active']} Fragen / {result['facts']} Fakten / {result['reference']} Referenzfragen / {result['version']}")
    except (ValueError, KeyError) as exc:
        sys.exit(str(exc))
