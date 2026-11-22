"""Prüft die historischen Quellenstände und die nachgewiesenen Redaktionsrevisionen offline."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import subprocess
from collections import Counter
from datetime import datetime
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from jsonschema import Draft202012Validator, FormatChecker

from catalog import RUNTIME_FIELDS, distribution, editorial_archive, revision_stamp, verify, verify_classification


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "science"
EVIDENCE = SOURCE / "pruefung"
GEO_COLUMNS = {"capital": 5, "area": 6, "continent": 8, "tld": 9,
               "cur": 10, "currency": 11, "phone": 12, "neigh": 17}
GEO_DIGEST = "79f8f59ea01cbb40438bf1856dd6c2ff201f03f8fc72d0530b2646aaf603ef04"
CATEGORIES = ("nature_animals", "geography_travel", "everyday_technology")
ROTATION = ROOT / "content" / "rotation" / "2026-11"
BASE_COMMIT = "17e88f2d46c72ff1aa2128749757e1be453b550b"
QA_03 = ROOT / "release/qa/modern-0.3.0"
BASELINE_ZIP = ROOT / "release/qa/fragenpool/ausgangsversion.zip"
PACKAGES = {
    "reisen": {"Landschaften und Gewässer": 16, "Orientierung und Verkehrswege": 12,
               "Regionale Reisegeografie": 12},
    "natur": {"Verhalten heimischer Tiere": 6, "Wetter und Jahreszeiten": 6},
}
SERIES = {"03-reisen-hauptstaedte": "hauptstadt", "03-reisen-grenzen": "landgrenze",
          "03-reisen-waehrungen": "waehrung", "04-reisen-laenderdaten": "kennung"}


def check(condition: bool, detail: str) -> None:
    if not condition:
        raise ValueError(detail)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_tsv(path: Path):
    with path.open(encoding="utf-8", newline="") as source:
        return list(csv.DictReader(source, delimiter="\t"))


def historical_cards():
    paths = ["content/science", "content/rotation/2026-11", BASELINE_ZIP.relative_to(ROOT).as_posix()]
    data = subprocess.check_output(["git", "archive", "--format=zip", BASE_COMMIT, *paths], cwd=ROOT)
    cards = {}
    with ZipFile(BytesIO(data)) as archive:
        for item in archive.infolist():
            path = ROOT / item.filename
            if item.is_dir():
                continue
            if path.parent == SOURCE and path.suffix == ".json":
                cards[path] = json.loads(archive.read(item))
            elif (path.parent == EVIDENCE and path.suffix in {".tsv", ".json", ".jsonl", ".txt"} or
                  path.parent == ROTATION and path.stem in {"reisen", "natur", "alltag"} or path == BASELINE_ZIP):
                check(archive.read(item) == path.read_bytes(), str(path) + " historischer Beleg verändert")
    return cards


def verify_current_edits(historical, validator):
    former = {q["id"]: q for rows in historical.values() for q in rows}
    decisions = {}
    for mode, name in (("form_herleiten", "alte-herleitungen.json"),
                       ("form_wiedererkennen", "ueberarbeitete-wissensabfragen.json")):
        for entry in read_json(QA_03 / name):
            key = entry["id"]
            if key in former:
                check(key not in decisions, key + " doppelte Änderungsentscheidung")
                decisions[key] = (mode, entry)
    revisions = read_json(ROOT / "specs/revision-history.json")
    processed = set()
    new_prompts, new_options = 0, 0
    for path, old_rows in historical.items():
        rows = read_json(path)
        ids = [q["id"] for q in rows]
        check(len(ids) == len(set(ids)) and set(ids) == {q["id"] for q in old_rows},
              path.name + " IDs des historischen Redaktionsbestands")
        for q in rows:
            key, old = q["id"], former[q["id"]]
            if key not in decisions:
                check(q == old, key + " geändert ohne Revisionsentscheidung")
                continue
            mode, decision = decisions[key]
            processed.add(key)
            allowed = {"question", "options", "tags", "review", "content_revision"}
            check({k: v for k, v in old.items() if k not in allowed} ==
                  {k: v for k, v in q.items() if k not in allowed},
                  key + " Änderung außerhalb der redaktionellen Entscheidung")
            verify(q, validator)
            verify_classification(q)
            check(q["content_revision"] == decision["revision"] == old["content_revision"] + 1,
                  key + " nicht belegte Inhaltsrevision")
            check(mode in old["tags"] and decision["neu"] in q["tags"], key + " Frageform der Entscheidung")
            is_clue = decision["neu"] == "form_herleiten"
            check(decision.get("hinweisfrage", is_clue) == is_clue, key + " widersprüchliche Hinweisentscheidung")
            expected_tags = (set(old["tags"]) - {mode, "tagesraetsel"}) | {decision["neu"]}
            if is_clue:
                expected_tags.add("tagesraetsel")
            check(set(q["tags"]) == expected_tags, key + " Themen- und Hinweiszuordnung")
            prompt_changed = q["question"] != old["question"]
            check(prompt_changed == decision.get("neuer_fragesatz", True), key + " Revision des Fragetextes")
            previous = {o["id"]: o["text"] for o in old["options"]}
            current = {o["id"]: o["text"] for o in q["options"]}
            right = old["correct_option_id"]
            check(previous.keys() == current.keys() and current[right] == previous[right],
                  key + " Identität des Antwortschlüssels und der korrekten Antwort")
            options_changed = old["options"] != q["options"]
            check(not options_changed or prompt_changed, key + " Antwortalternativen ohne redigierte Aufgabe")
            source_ids = [s["id"] for s in q["sources"]]
            for step in ("fact", "editorial"):
                check(q["review"][step]["actor_type"] == "agent" and q["review"][step]["source_ids"] == source_ids,
                      key + " Agentenprüfung der belegten Quellen")
            times = [old["review"]["approved_at"], q["review"]["fact"]["at"], q["review"]["editorial"]["at"]]
            prior, fact, edit = map(datetime.fromisoformat, times)
            check(prior < fact < edit, key + " zeitliche Reihenfolge der Revision")
            runtime = {k: q[k] for k in RUNTIME_FIELDS}
            runtime["sources"] = [{k: s[k] for k in ("title", "url")} for s in q["sources"]]
            check(revisions.get(key) == revision_stamp(runtime), key + " Fingerabdruck der neuen Fassung")
            new_prompts += int(prompt_changed)
            new_options += int(options_changed)
    check(processed == set(decisions), "nicht zugeordnete 0.3-Entscheidung")
    print(f"0.3: {len(processed)} belegte Agentenrevisionen für {len(former)} bestehende Karten, "
          f"davon {new_prompts} neue Fragetexte und {new_options} geänderte Antwortlisten. "
          "Sachverhalt, semantische Revision, Lösung und Quellen identisch.")


def check_mix(records):
    refs = [q for q in records if q["reference"]]
    check(len(records) == 600 and len(refs) == 75 and sum(q["starter"] for q in records) == 12,
          "Umfang oder Referenzbestand")
    check(all(v == [120, 60, 20] for v in distribution(records, CATEGORIES).values()),
          "Schwierigkeitsmix im aktiven Bestand")
    check(all(v == [15, 7, 3] for v in distribution(refs, CATEGORIES).values()), "Referenzmix")
    for field in ("id", "fact_key", "question"):
        check(len({q[field].casefold() for q in records}) == len(records), "Doppelt: " + field)


def verify_rotation_proof(q, old, proof, batch, old_files):
    key = q["id"]
    check((proof["frage"], proof["ersetzt"]) == (key, old["id"]), key + " Austauschbeleg")
    check(proof["schwierigkeit"] == q["difficulty"] == old["difficulty"], key + " Einstufung")
    check(set(q["tags"]) >= {"thema_" + proof["unterthema"], "form_" + proof["frageform"]},
          key + " Klassifikation")
    series = SERIES[old_files[old["id"]]] if batch == "reisen" else "natur"
    check(proof["ausgangsreihe"] == series, key + " Ausgangsreihe")
    if series == "kennung":
        check(old["id"].endswith(("-telefonvorwahl", "-laenderdomain")), key + " Länderkennung")
    source, = q["sources"]
    check(source["url"] == proof["quelle"] and source["checked_at"] == proof["erstabruf"],
          key + " Quellenzuordnung")
    markers = proof["belegstellen"]
    check(markers and all(re.fullmatch(r"L\d+(?:@P\d+)?", line) for line in markers) and
          proof["erneut_bestaetigte_fundstellen"] == markers, key + " erneuter Vergleich der Fundstellen")
    check(re.fullmatch(r"[a-f0-9]{64}", proof["beleg_sha256"]), key + " Quellenfingerabdruck")
    chronology = [datetime.fromisoformat(proof[name]) for name in
                  ("erstabruf", "sachpruefung", "erneuter_quellenabruf", "zweite_pruefung")]
    check(chronology == sorted(chronology) and chronology[1] < chronology[2] and
          chronology[2] < chronology[3], key + " Prüfreihenfolge")
    for step, date in (("fact", "sachpruefung"), ("editorial", "zweite_pruefung")):
        review = q["review"][step]
        check(review["at"] == proof[date] and review["actor_type"] == "agent" and
              review["source_ids"] == [source["id"]], key + " Prüfverantwortung")
    check(bool(proof["pruefvermerk"].strip()), key + " Einzelvermerk")


def verify_rotations(base, old_files, validator, historical):
    combined = dict(base)
    all_pairs = []
    cited = {}
    for batch, total in (("reisen", 40), ("natur", 12), ("alltag", 20)):
        new_rows = historical[SOURCE / f"2026-11-{batch}.json"]
        pairs = read_json(ROTATION / f"{batch}.json")
        check(len(new_rows) == len(pairs) == total, batch + " Umfang")
        check({p["new_id"] for p in pairs} == {q["id"] for q in new_rows}, batch + " Austauschliste")
        all_pairs.extend(pairs)
        old_ids = {p["new_id"]: p["old_id"] for p in pairs}
        proofs = {}
        if batch in PACKAGES:
            evidence = read_json(EVIDENCE / f"2026-11-{batch}-belege.json")
            proofs = {p["frage"]: p for p in evidence}
            check(len(evidence) == total and set(proofs) == set(old_ids), batch + " Einzelbelege")
            check(Counter(p["redaktionspaket"] for p in evidence) == PACKAGES[batch], batch + " Redaktionsthemen")
            check(len({p["pruefvermerk"] for p in evidence}) == total, batch + " Einzelvermerke")
            if batch == "reisen":
                check(Counter(p["ausgangsreihe"] for p in evidence) ==
                      {"hauptstadt": 14, "landgrenze": 12, "waehrung": 8, "kennung": 6},
                      "Verteilung der entnommenen Länderfragen")
        for q in new_rows:
            key = q["id"]
            check(key not in combined and old_ids[key] in base, key + " IDs")
            check(q["status"] == "release_approved" and not q["human_test_observations"] and
                  not q.get("reference") and not q.get("starter"), key + " Redaktionsstatus")
            verify(q, validator)
            verify_classification(q)
            if proofs:
                verify_rotation_proof(q, base[old_ids[key]], proofs[key], batch, old_files)
                source, = q["sources"]
                title, ids = cited.setdefault(source["url"], (source["title"], set()))
                check(title == source["title"], key + " abweichender Quellentitel")
                ids.add(key)
            combined[key] = q
    register = read_tsv(EVIDENCE / "2026-11-quellen.tsv")
    check(len(register) == len(cited) and {r["URL"] for r in register} == set(cited),
          "November-Quellenregister unvollständig")
    for r in register:
        title, ids = cited[r["URL"]]
        check(title == r["Titel"] and set(r["Fragen-IDs"].split(", ")) == ids and
              r["Herausgeber"].strip() and r["Verwendung im deutschen Quiz"].strip(),
              r["URL"] + " Quellenregister")
    archived = {r["id"] for r in editorial_archive(combined.values(), all_pairs)}
    check(len({q["fact_key"] for q in combined.values()}) == len(combined), "Früherer Sachverhalt wiederverwendet")
    check_mix([q for key, q in combined.items() if key not in archived])
    return len(archived)


def verify_local_sources() -> None:
    historical = historical_cards()
    catalog = {}
    domains = Counter()
    evidence_counts = Counter()
    raw = (EVIDENCE / "geonames-pays.txt").read_bytes()
    check(hashlib.sha256(raw).hexdigest() == GEO_DIGEST, "GeoNames-Rohdatei verändert")
    geo = raw.decode("utf-8-sig").splitlines()
    revised = {}
    web_proofs = {r["fact_key"]: r for r in read_tsv(EVIDENCE / "web-fundstellen.tsv")}
    for path in sorted(EVIDENCE.glob("*revision2.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            plan = json.loads(line)
            key = plan["fact_key"]
            check(key not in revised, "Doppeltes Revisionsprotokoll " + key)
            revised[key] = plan
    validator = Draft202012Validator(read_json(ROOT / "specs/question.schema.json"),
                                     format_checker=FormatChecker())
    with ZipFile(BASELINE_ZIP) as archive:
        baseline = json.loads(archive.read("catalog.json"))
    check(baseline["version"] == "de-7363fcba52a1", "Unbekannte Ausgangsversion")
    before = {q["id"]: q for q in baseline["questions"] if q["category"] in CATEGORIES}
    old_files = {}
    for path in sorted(p for p in historical if re.match(r"[0-9]{2}-", p.name)):
        base_proofs = {r["fact_key"]: r for r in read_tsv(EVIDENCE / (path.stem + ".tsv"))}
        records = historical[path]
        check(len(records) == len(base_proofs), "Fehlende Erstbelege in " + path.name)
        for q in records:
            key = q["fact_key"]
            check(key not in catalog, "Doppelter Wissensfakt " + key)
            catalog[key] = q
            old_files[q["id"]] = path.stem
            initial = before[q["id"]]
            for field in ("fact_key", "question", "options", "correct_option_id", "explanation",
                          "semantic_revision", "valid_until", "category"):
                check(initial[field] == q[field], key + " archivierter Sachtext: " + field)
            check(initial["sources"] == [{k: s[k] for k in ("title", "url")} for s in q["sources"]],
                  key + " archivierte Quellen")
            check(q["content_revision"] >= initial["content_revision"] and
                  set(initial["tags"]) <= set(q["tags"]), key + " Klassifikationsrevision")
            verify(q, validator)
            check(q["status"] == "release_approved" and not q["human_test_observations"], key)
            source = q["sources"][0]
            proof = base_proofs[key]
            check(source["url"] == proof["Quelle"] and proof["Abruf UTC"] == source["checked_at"], key)
            domains[source["url"]] += 1
            loc = proof["Fundstelle im Textabruf"]
            if "geonames.org/" in source["url"]:
                refs = re.findall(r"Datensatz ([A-Z]{2}), Zeile (\d+) \(([^)]+)\)", loc)
                check(bool(refs), key + " Länderdaten-Fundstelle")
                for country, row_no, _fields in refs:
                    check(geo[int(row_no) - 1].split("\t")[0] == country, key + " GeoNames-Zeile")
                evidence_counts["countryInfo"] += 1
            else:
                check(bool(re.fullmatch(r"L\d+(?:,L\d+)*", loc)), key + " Webfundstelle")
                marker = web_proofs[key]
                check(marker["URL"] == source["url"] and
                      re.fullmatch(r"[0-9a-f]{64}", marker["SHA256 der UTF-8-Textzeilen"]),
                      key + " Quellenfingerabdruck")
                evidence_counts["Web"] += 1
            fact_time, editorial_time = proof["Sachprüfung UTC"], proof["Redaktion UTC"]
            if initial["content_revision"] == 2:
                plan = revised[key]
                check(plan["batch"] == path.stem, key + " Revisionscharge")
                fact_time, editorial_time = plan["fact_at"], plan["editorial_at"]
                if "explanation" in plan:
                    check(plan["question"] == q["question"] and plan["explanation"] == q["explanation"], key)
                    for evidence in plan["checks"]:
                        raw_fields = geo[evidence["line"] - 1].split("\t")
                        check(raw_fields[0] == evidence["iso"], key + " GeoNames-Code")
                        check(raw_fields[GEO_COLUMNS[evidence["field"]]] == evidence["value"],
                              key + " GeoNames-Feldwert")
                else:
                    check(initial["tags"] == plan["tags"] and source["url"] == plan["source_url"], key)
            else:
                check(initial["content_revision"] == 1 and key not in revised, key + " Revision")
            if q["content_revision"] == initial["content_revision"]:
                check(q["review"]["fact"]["at"] == fact_time and
                      q["review"]["editorial"]["at"] == editorial_time, key + " ursprüngliche Prüfzeit")
            else:
                verify_classification(q)
                check(datetime.fromisoformat(q["review"]["fact"]["at"]) > datetime.fromisoformat(editorial_time),
                      key + " Prüfzeit der Klassifikation")
    records = list(catalog.values())
    check(set(old_files) == set(before), "Ausgangskatalog unvollständig")
    check({q["fact_key"] for q in before.values() if q["content_revision"] == 2} == set(revised),
          "Revisionsnachweise der Ausgangsfassung")
    check_mix([{**q, "difficulty": before[q["id"]]["difficulty"]} for q in records])
    check(len(web_proofs) == evidence_counts["Web"], "Überzählige Webfundstellen")
    source_index = {r["URL"]: int(r["Fragen"]) for r in read_tsv(EVIDENCE / "quellenregister.tsv")}
    check(dict(domains) == source_index, "Quellenregister stimmt nicht mit den Fragen überein")
    count = verify_rotations({q["id"]: q for q in records}, old_files, validator, historical)
    print(f"Ausgangsfassung: {len(records)} Fragen, {len(domains)} Quellen-URLs, "
          f"{evidence_counts['countryInfo']} GeoNames- und {evidence_counts['Web']} Webbelege, "
          f"{len(revised)} frühere zweite Inhaltsrevisionen.")
    print(f"November-Rotation: {count} Archivierungen und neue Karten. "
          "40 Reise- und 12 Naturkarten mit einzelnem zweitem Quellenabgleich, 20 Alltagskarten mit Austauschliste.")
    print(f"Stand {BASE_COMMIT[:8]}: 600 aktive Fragen, 75 Referenzen, 12 Starter. "
          "Je Kategorie 120/60/20, in der Referenz 15/7/3. "
          "0 menschliche Beobachtungen.")
    verify_current_edits(historical, validator)


if __name__ == "__main__":
    verify_local_sources()
