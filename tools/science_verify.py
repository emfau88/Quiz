"""Prüft Fragebelege und die lokalen GeoNames-Fundstellen ohne Netzwerk."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

from catalog import verify


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "science"
EVIDENCE = SOURCE / "pruefung"
GEO_COLUMNS = {"capital": 5, "area": 6, "continent": 8, "tld": 9,
               "cur": 10, "currency": 11, "phone": 12, "neigh": 17}
GEO_DIGEST = "79f8f59ea01cbb40438bf1856dd6c2ff201f03f8fc72d0530b2646aaf603ef04"


def check(condition: bool, detail: str) -> None:
    if not condition:
        raise ValueError(detail)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_tsv(path: Path):
    with path.open(encoding="utf-8", newline="") as source:
        return list(csv.DictReader(source, delimiter="\t"))


def verify_local_sources() -> None:
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
    for path in sorted(SOURCE.glob("*.json")):
        base_proofs = {r["fact_key"]: r for r in read_tsv(EVIDENCE / (path.stem + ".tsv"))}
        records = read_json(path)
        check(len(records) == len(base_proofs), "Fehlende Erstbelege in " + path.name)
        for q in records:
            key = q["fact_key"]
            check(key not in catalog, "Doppelter Wissensfakt " + key)
            catalog[key] = q
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
            if q["content_revision"] == 2:
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
                    check(q["tags"] == plan["tags"] and source["url"] == plan["source_url"], key)
            else:
                check(q["content_revision"] == 1 and key not in revised, key + " Revision")
            check(q["review"]["fact"]["at"] == fact_time and
                  q["review"]["editorial"]["at"] == editorial_time, key + " Prüfzeit")
    records = list(catalog.values())
    check({k for k, q in catalog.items() if q["content_revision"] == 2} == set(revised), "Revisionsnachweise")
    for field in ("id", "question"):
        check(len({q[field].casefold() for q in records}) == len(records), field)
    counts = Counter((q["category"], q["difficulty"]) for q in records)
    references = Counter((q["category"], q["difficulty"]) for q in records if q["reference"])
    for category in ("nature_animals", "geography_travel", "everyday_technology"):
        check([counts[category, k] for k in ("easy", "medium", "hard")] == [120, 60, 20], category)
        check([references[category, k] for k in ("easy", "medium", "hard")] == [15, 7, 3], category)
    check(len(records) == 600 and sum(q["starter"] for q in records) == 12, "Chargenumfang")
    check(len(web_proofs) == evidence_counts["Web"], "Überzählige Webfundstellen")
    source_index = {r["URL"]: int(r["Fragen"]) for r in read_tsv(EVIDENCE / "quellenregister.tsv")}
    check(dict(domains) == source_index, "Quellenregister stimmt nicht mit den Fragen überein")
    print(f"{len(records)} Fragen, {sum(references.values())} Referenzfragen, {len(domains)} Quellen-URLs.")
    print(f"{evidence_counts['countryInfo']} GeoNames-Fakten, {evidence_counts['Web']} Fragen mit Webfundstellen.")
    print(f"{len(revised)} nachgeprüfte Inhaltsrevisionen. Je Kategorie 120/60/20, in der Referenz 15/7/3.")
    print("0 menschliche Beobachtungen. Alle Sach- und Textnachweise zur aktiven Revision vorhanden.")


if __name__ == "__main__":
    verify_local_sources()
