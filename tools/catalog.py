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


def build(stage, output, as_of):
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
    corrections = read(ROOT / "content/corrections.json")
    blocked = {(c["id"], c["semantic_revision"]) for c in corrections}
    require(len(blocked) == len(corrections) and all(c["reason"].strip() for c in corrections), "ungültiges Rückzugsmanifest")
    require(all((q["id"], q["semantic_revision"]) in blocked for q in all_rows if q["status"] == "retired"), "Rückzug ohne Sperrvermerk")
    approved = [q for q in all_rows if q["status"] == "release_approved"
                and (q["id"], q["semantic_revision"]) not in blocked
                and (not q["valid_until"] or q["valid_until"] >= as_of)]
    rows = sorted((q for q in approved if stage not in ("starter", "reference") or q.get(stage)), key=lambda q: q["id"])
    unique([normalize(q["fact_key"]) for q in rows], "doppelter aktiver Sachverhalt")
    unique([normalize(q["question"]) for q in rows], "gleichlautender Fragetext")
    mix = distribution(rows, rules["categories"])
    reference = distribution([q for q in rows if q.get("reference")], rules["categories"])
    exact_reference = all(v == rules["catalog"]["reference_mix"] for v in reference.values())
    exact_release = all(v == rules["catalog"]["release_mix"] for v in mix.values())
    if stage in ("reference", "release"):
        require(exact_reference, f"Referenzverteilung unvollständig: {reference}")
    if stage == "release":
        require(exact_release, f"Releaseverteilung unvollständig: {mix}")
    require(len(rows) >= rules["catalog"]["starter_min"], "Mindestens 20 belegte Fragen erforderlich")
    require(all(sum(v) > 0 for v in mix.values()), "Eine Kategorie fehlt")
    history_file = ROOT / "specs/revision-history.json"
    history = read(history_file) if history_file.exists() else {}
    runtime = []
    for q in rows:
        entry = {k: q[k] for k in RUNTIME_FIELDS}
        entry["sources"] = [{k: s[k] for k in ("title", "url")} for s in q["sources"]]
        old = history.get(q["id"])
        if old:
            digest = hashlib.sha256(encode(entry).encode()).hexdigest()
            require(q["content_revision"] >= old["revision"], f"Revision zurückgesetzt: {q['id']}")
            require(q["content_revision"] > old["revision"] or old["sha256"] == digest, f"Inhalt ohne Revisionswechsel: {q['id']}")
        runtime.append(entry)
    content_hash = hashlib.sha256(encode([runtime, corrections]).encode()).hexdigest()
    version = "de-" + content_hash[:12]
    manifest = {"version": version, "sha256": content_hash, "active": len(rows), "facts": len({q["fact_key"] for q in rows}),
                "starter": sum(bool(q.get("starter")) for q in rows), "reference": sum(bool(q.get("reference")) for q in rows),
                "categories": mix, "reference_categories": reference, "reference_complete": exact_reference,
                "release_distribution_complete": exact_reference and exact_release, "corrections": len(corrections),
                "human_observations": sum(len(q["human_test_observations"]) for q in rows)}
    output.mkdir(parents=True, exist_ok=True)
    (output / "catalog.json").write_text(encode({"version": version, "questions": runtime, "corrections": corrections}) + "\n", encoding="utf-8")
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "web/js/rules.js").write_text("// Generated from specs/product_rules.json.\nexport const RULES = " + json.dumps(rules, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=["starter", "reference", "batch", "release"], default="batch")
    parser.add_argument("--output", type=Path, default=DATA)
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    parser.add_argument("--record-history", action="store_true", help="record hashes after editorial acceptance")
    args = parser.parse_args()
    try:
        result = build(args.stage, args.output, args.as_of.isoformat())
        if args.record_history:
            history_path = ROOT / "specs/revision-history.json"
            history = read(history_path) if history_path.exists() else {}
            for entry in read(args.output / "catalog.json")["questions"]:
                history[entry["id"]] = {"revision": entry["content_revision"], "semantic_revision": entry["semantic_revision"],
                                        "sha256": hashlib.sha256(encode(entry).encode()).hexdigest()}
            history_path.write_text(json.dumps(history, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
        print(f"{result['active']} Fragen / {result['facts']} Fakten / {result['reference']} Referenzfragen / {result['version']}")
    except (ValueError, KeyError) as exc:
        sys.exit(str(exc))
