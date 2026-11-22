"""Verify the November rotation against the shipped 0.1.0 catalog and its editorial records."""
from collections import Counter
import json
from pathlib import Path
from zipfile import ZipFile

from catalog import read, distribution, LEVELS, require

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "release/qa/fragenpool"
TARGETS = {"entertainment": 48, "geography_travel": 40, "everyday_technology": 20,
           "history_discoveries": 16, "language_culture": 16, "nature_animals": 12}


def save(name, value):
    (QA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def indexed(rows):
    return {q["id"]: q for q in rows}


def tag(q, prefix):
    value, = [v[len(prefix):] for v in q["tags"] if v.startswith(prefix)]
    return value


def main():
    with ZipFile(QA / "ausgangsversion.zip") as archive:
        before = json.loads(archive.read("catalog.json"))
    require(before["version"] == "de-7363fcba52a1", "Unerwartete Ausgangsversion")
    current = read(ROOT / "web/data/catalog.json")
    old, active = indexed(before["questions"]), indexed(current["questions"])
    initial = indexed(read(QA / "klassifikation-ausgang.json")["questions"])
    require(set(old) == set(initial), "Ausgangsraster unvollständig")
    added, omitted, shared = active.keys() - old, old.keys() - active, old.keys() & active.keys()
    require(len(added) == len(omitted) == 152 and len(shared) == 1048, "Sollmenge der Rotation verfehlt")
    old_facts = {row["fact_key"] for row in old.values()}
    require(len({active[id]["fact_key"] for id in added} - old_facts) == 152, "Fakt schon früher gespielt")
    require({q["id"] for q in current["archived"]} == omitted, "Archiv passt nicht zu den entnommenen Karten")
    originally_ref = {id for id, row in initial.items() if row["reference"]}
    sources = {q["id"]: q for path in (ROOT / "content").glob("*/*.json") for q in read(path)}
    require({id for id in active if sources[id].get("reference")} == originally_ref and len(originally_ref) == 150,
            "Referenzfragen abgewichen")
    for id in shared:
        q = active[id]
        for field in ("fact_key","question","options","correct_option_id","explanation","sources","semantic_revision","valid_until"):
            require(old[id][field] == q[field], f"Belegkern verändert: {id}, {field}")
        require(q["content_revision"] > old[id]["content_revision"], f"Datenrevision fehlt: {id}")
        require(set(old[id]["tags"]) <= set(q["tags"]), f"Früheres Merkmal verloren: {id}")
    pairs = [row for p in sorted((ROOT / "content/rotation/2026-11").glob("*.json")) for row in read(p)]
    require({p["old_id"] for p in pairs} == omitted and {p["new_id"] for p in pairs} == added, "Austauschliste unvollständig")
    roster = []
    for p in pairs:
        a, b = old[p["old_id"]], active[p["new_id"]]
        roster.append({**p, "category":b["category"], "old_topic":initial[a["id"]]["topic"], "new_topic":tag(b,"thema_"),
                       "old_difficulty":a["difficulty"], "new_difficulty":b["difficulty"], "question":b["question"]})
    counts = Counter(row["category"] for row in roster)
    require(counts == TARGETS, f"Abweichende Kategorien der neuen Karten: {counts}")
    rules = read(ROOT / "specs/product_rules.json")
    report = {}
    for category in rules["categories"]:
        rows = [q for q in active.values() if q["category"] == category]
        levels = distribution(rows,[category])[category]
        ref_levels = distribution([q for q in rows if q["id"] in originally_ref],[category])[category]
        require(levels == [120,60,20] and ref_levels == [15,7,3], f"Schwierigkeitsmix: {category}")
        report[category] = {"active":len(rows),"new":counts[category],"reference":sum(ref_levels),
                            "difficulty":dict(zip(LEVELS,levels)),
                            "topics":dict(sorted(Counter(tag(q,"thema_") for q in rows).items())),
                            "forms":dict(sorted(Counter(tag(q,"form_") for q in rows).items()))}
    fixed = {id:{"from":old[id]["difficulty"],"to":active[id]["difficulty"],"reason":initial[id]["difficulty_reason"]}
             for id in sorted(shared) if old[id]["difficulty"] != active[id]["difficulty"]}
    series = {}
    for batch, count in (("culture/escene",30),("culture/estage",20),("science/03-reisen-hauptstaedte",18),
                         ("science/03-reisen-grenzen",14),("science/03-reisen-waehrungen",10)):
        ids = {q["id"] for q in read(ROOT / ("content/"+batch+".json"))}
        series[batch] = {"before":len(ids),"after":len(ids & active.keys())}
        require(series[batch]["after"] == count, f"Reihe {batch} falsch")
    save("austausch.json",roster)
    save("inhaltsabgleich.json",{"baseline":before["version"],"catalog":current["version"],"active":len(active),
         "facts":len({q["fact_key"] for q in active.values()}),"retained":len(shared),"new":len(added),
         "archived":len(omitted),"reference":len(originally_ref),"categories":report,"original_series":series,
         "changed_difficulties":fixed,"distinct_source_urls":len({s["url"] for q in active.values() for s in q["sources"]}),
         "damals_und_heute":sum("damals_und_heute" in q["tags"] for q in active.values()),
         "with_expiry":sum(bool(q["valid_until"]) for q in active.values())})
    print(f"{current['version']}: {len(shared)} übernommene, {len(added)} neue, {len(omitted)} archivierte Sachverhalte.")


if __name__ == "__main__":
    main()
