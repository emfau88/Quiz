"""Verify the two issue 0.3 science and travel additions and their editorial evidence."""

import argparse
from collections import Counter, defaultdict
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

from jsonschema import Draft202012Validator, FormatChecker

from catalog import ROOT, normalize, read, require, unique, verify, verify_classification


CONTENT = ROOT / "content/science"
PROOF = CONTENT / "pruefung/03-modern"
PACKAGES = {"reisen": "geography_travel", "natur": "nature_animals"}
TEXT_FIELDS = ("fact_key", "category", "difficulty", "question", "options", "correct_option_id",
               "explanation", "tags")
NEW_FORMS = {"form_herleiten", "form_schaetzen", "form_vergleichen", "form_zeitlich_einordnen", "form_anwenden"}
GRADES = {"easy": 176, "medium": 88, "hard": 30}


def sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def check_proof(card, proof, snapshot):
    key = card["id"]
    text = json.dumps([card[k] for k in TEXT_FIELDS], ensure_ascii=False, separators=(",", ":"))
    require(proof["text_sha256"] == sha256(text), f"{key}: redaktioneller Textstand")
    require(proof["einzelvermerk"].strip(), f"{key}: individueller Redaktionsvermerk fehlt")
    require(proof["sachpruefung"] == card["review"]["fact"]["at"] and
            proof["zweitpruefung"] == card["review"]["editorial"]["at"], f"{key}: Prüfdaten")
    saw_fact = datetime.fromisoformat(proof["sachpruefung"])
    saw_editorial = datetime.fromisoformat(proof["zweitpruefung"])
    by_id = {s["id"]: s for s in card["sources"]}
    require([p["id"] for p in proof["quellen"]] == list(by_id), f"{key}: Quellenliste")
    for step in ("fact", "editorial"):
        testimony = card["review"][step]
        require(testimony["actor_type"] == "agent" and testimony["source_ids"] == list(by_id),
                f"{key}: Redakteur und Primärbelege der Prüfung")
    for pos, ref in enumerate(proof["quellen"]):
        source = by_id[ref["id"]]
        require((ref["url"], ref["erstabruf"]) == (source["url"], source["checked_at"]),
                f"{key}: Originaladresse oder Abrufzeit")
        require(ref["fundstellen"] and all(re.fullmatch(r"L\d+(?:@P\d+)?", m) for m in ref["fundstellen"]),
                f"{key}: Fundstellen")
        unique(ref["fundstellen"], f"{key}: doppelte Fundstelle")
        require(re.fullmatch(r"[a-f0-9]{64}", ref["beleg_sha256"]), f"{key}: Belegfingerabdruck")
        opened = datetime.fromisoformat(ref["erstabruf"])
        times = [datetime.fromisoformat(v) for v in ref["bestaetigungszeiten"]]
        require(len(times) == len(ref["fundstellen"]) and
                all(opened <= saw_fact < t < saw_editorial for t in times) and
                max(times) == datetime.fromisoformat(ref["wiederabruf"]), f"{key}: Wiederabruf je Fundstelle")
        if snapshot is not None:
            evidence = snapshot["evidence"][pos]
            require(evidence["url"] == source["url"] and evidence["claim"] == source["verified_claim"] and
                    evidence["markers"] == ref["fundstellen"] and
                    evidence["confirmation_times"] == ref["bestaetigungszeiten"], f"{key}: Arbeitsbeleg")
            lines = evidence["lines"]
            require(len(lines) == len(ref["fundstellen"]) and
                    all(line.startswith(marker + ":") for marker, line in zip(ref["fundstellen"], lines)) and
                    sha256("\n".join(lines)) == ref["beleg_sha256"], f"{key}: Quellenauszug")


def check_package(name, category, validator, snapshots):
    cards = read(CONTENT / f"03-modern-{name}.json")
    proofs = read(PROOF / f"einzelbelege-{name}.json")
    require(len(cards) == len(proofs) == 294, f"{name}: Karten und Einzelbelege")
    require(Counter(q["difficulty"] for q in cards) == GRADES, f"{name}: Schwierigkeitsverteilung")
    require([q["id"] for q in cards] == [p["id"] for p in proofs], f"{name}: Belegreihenfolge")
    unique([p["einzelvermerk"] for p in proofs], f"{name}: wiederholter Einzelvermerk")
    expected_groups = {f"{name[0]}{n:02}" for n in range(1, 22)}
    require(Counter(p["pruefgruppe"] for p in proofs) == {g: 14 for g in expected_groups},
            f"{name}: Zählung der Prüfpakete")
    snapshots_by_id = {}
    if snapshots:
        with (snapshots / f"reviewed-{name}.jsonl").open(encoding="utf-8") as file:
            snapshots_by_id = {r["id"]: r for line in file if (r := json.loads(line))}
        require(set(snapshots_by_id) == {q["id"] for q in cards}, f"{name}: Arbeitskopien")
    forms = Counter()
    for card, proof in zip(cards, proofs):
        key = card["id"]
        verify(card, validator)
        verify_classification(card)
        require(card["category"] == category and card["status"] == "release_approved" and
                not card.get("reference") and not card.get("starter") and not card["human_test_observations"],
                f"{key}: Status der Erweiterung")
        form, = (tag for tag in card["tags"] if tag.startswith("form_"))
        eligible = form == "form_herleiten"
        require(form in NEW_FORMS and ("tagesraetsel" in card["tags"]) == eligible, f"{key}: Form und Tagesrolle")
        require(len(card["tags"]) == 2 + int(eligible), f"{key}: unerwartete Tags")
        forms[form] += 1
        check_proof(card, proof, snapshots_by_id.get(key))
    require(forms["form_schaetzen"] >= 28 and forms["form_herleiten"] >= 50, f"{name}: Formenquoten")
    print(f"{category}: {len(cards)} Karten, 176/88/30. " + ", ".join(
        f"{f.removeprefix('form_')} {forms[f]}" for f in sorted(NEW_FORMS)))
    return cards


def check_sources(cards):
    register = read(PROOF / "quellen.json")
    cited = defaultdict(list)
    for card in cards:
        for source in card["sources"]:
            cited[source["url"]].append((card["id"], source["title"]))
    require([r["url"] for r in register] == sorted(cited), "Quellenregister und zitierte URLs")
    for entry in register:
        url = entry["url"]
        uses = cited[url]
        require(urlsplit(url).scheme == "https" and entry["herausgeber"].strip(), f"{url}: Herausgeber")
        require({title for _, title in uses} == {entry["titel"]} and
                sorted(qid for qid, _ in uses) == entry["fragen"], f"{url}: Quellenregister")
    return len(register), sum(map(len, cited.values()))


def check_duplicates(cards):
    own_files = {CONTENT / f"03-modern-{name}.json" for name in PACKAGES}
    others = [card for path in (ROOT / "content").glob("*/*.json") if path not in own_files
              for card in read(path)]
    for field in ("id", "fact_key", "question"):
        ours = [normalize(q[field]) for q in cards]
        unique(ours, f"Eigene Dopplung: {field}")
        common = set(ours).intersection(normalize(q[field]) for q in others)
        require(not common, f"Überschneidung mit anderem Bestand ({field}): {sorted(common)}")
    return len(others)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--working-snapshots", type=Path, help="optionale lokale Arbeitskopien mit Originalzeilen")
    args = parser.parse_args()
    schema = Draft202012Validator(read(ROOT / "specs/question.schema.json"), format_checker=FormatChecker())
    cards = [q for name, category in PACKAGES.items()
             for q in check_package(name, category, schema, args.working_snapshots)]
    sources, links = check_sources(cards)
    others = check_duplicates(cards)
    print(f"{len(cards)} Einzelbelege, {sources} Quellen, {links} Quellenzuordnungen. "
          f"ID, Sachverhaltsschlüssel und Fragetext gegen {others} weitere redaktionelle Datensätze geprüft.")
