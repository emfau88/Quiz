"""Compare the active 0.3 catalog with the shipped 0.2 catalog, including source-side reference flags."""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "17e88f2d46c72ff1aa2128749757e1be453b550b"
QA = ROOT / "release/qa/modern-0.3.0"
def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))
def count(rows, key):
    return dict(sorted(Counter(key(q) for q in rows).items()))
def form(q):
    return next(t for t in q["tags"] if t.startswith("form_"))
def summarize(rows):
    return dict(active=len(rows),facts=len({q["fact_key"] for q in rows}),
                categories=count(rows, lambda q:q["category"]), difficulties=count(rows, lambda q:q["difficulty"]),
                forms=count(rows, form), languages=["de"], research=count([q for q in rows if q.get("research")],
                lambda q:q["research"]["published_on"][:4]), sources=len({s["url"] for q in rows for s in q["sources"]}),
                categoryForms={c:count([q for q in rows if q["category"]==c],form) for c in sorted({q["category"] for q in rows})},
                topics=len({(q["category"],next(t for t in q["tags"] if t.startswith("thema_"))) for q in rows}))
def main():
    former=json.loads(subprocess.check_output(["git","show",BASE+":web/data/catalog.json"],cwd=ROOT))
    current=read(ROOT/"web/data/catalog.json")
    old={q["id"]:q for q in former["questions"]}
    new={q["id"]:q for q in current["questions"]}
    kept=sorted(old.keys() & new.keys())
    added=sorted(new.keys()-old.keys())
    removed=sorted(old.keys()-new.keys())
    assert len(new)>=2*len(old) and len(kept)+len(added)==len(new)
    assert not {new[q]["fact_key"] for q in added} & {q["fact_key"] for q in old.values()}
    assert all(new[q]["fact_key"]==old[q]["fact_key"] and new[q]["semantic_revision"]==old[q]["semantic_revision"] for q in kept)
    def solution(q):
        return next(o for o in q["options"] if o["id"]==q["correct_option_id"])
    assert all(solution(new[q])==solution(old[q]) for q in kept)
    assert all(form(old[q])=="form_wiedererkennen" for q in removed)
    assert all(q in {a["id"] for a in current["archived"]} for q in removed)
    assert len({q["fact_key"] for q in new.values()})==len(new)
    reference={q["id"] for file in (ROOT/"content").glob("*/*.json") for q in read(file) if q.get("reference")}
    assert len(reference)==150 and reference<=set(kept)
    changed=[q for q in kept if new[q]!=old[q]]
    daily_clues = set(current["daily_clues"])
    assert daily_clues and all("tagesraetsel" in new[q]["tags"] for q in daily_clues)
    findings = [q for q in new.values() if q.get("research")]
    original_links = {q["research"]["url"] for q in findings}
    assert len(findings) == len(original_links)
    research_dates = sorted(q["research"]["published_on"] for q in findings)
    report=dict(at=datetime.now(timezone.utc).isoformat(),baselineCommit=BASE,beforeVersion=former["version"],
                afterVersion=current["version"],before=summarize(old.values()),after=summarize(new.values()),
                retained=len(kept),new=len(added),archivedPreviouslyActive=len(removed),preservedReferences=len(reference),
                retainedWithEditorialRevision=len(changed),retainedWithNewPrompt=sum(new[q]["question"]!=old[q]["question"] for q in kept),
                retainedWithNewDistractors=sum(new[q]["options"]!=old[q]["options"] for q in kept),
                dailyClues=len(daily_clues),dailyCluesByCategory=count([new[q] for q in daily_clues],lambda q:q["category"]),
                researchPublications=len(original_links),earliestPublication=research_dates[0],latestPublication=research_dates[-1],
                newForms=count([new[q] for q in added],form), sha256Runtime=hashlib.sha256((ROOT/"web/data/catalog.json").read_bytes()).hexdigest())
    QA.mkdir(exist_ok=True,parents=True)
    (QA/"bestand.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
    print(report["before"]["forms"],report["after"]["forms"],len(added),len(removed))

if __name__=="__main__":
    main()
