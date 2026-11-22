"""List pairs for editorial review using the wording, solution and explanation of the active cards."""
from collections import Counter, defaultdict
from itertools import combinations
import json
import math
from pathlib import Path
import re
import subprocess

from compare_content import candidates

ROOT = Path(__file__).resolve().parents[1]
BASE = "17e88f2d46c72ff1aa2128749757e1be453b550b"
QA = ROOT / "release/qa/modern-0.3.0"
OMIT = set("""werden welche einen einer einem beim seine ihrer ihren seines ihnen der die das unter durch sollte lässt zeigt weiter wenn wird seinen dieser beide dieses wofür damit wurden lassen hier eine welchem welche welcher gleichen ihre sein ist sind welches davon wieso dieser dieser obwohl etwas zwischen welche ihren dabei dagegen oder ohne kann können gibt erst was aber danach sehr sie für im ein und aus mit""".split())

def terms(text):
    return [word[:7] for word in re.findall(r"[a-zäöüß]{3,}",text.casefold()) if word not in OMIT]

def main():
    former = json.loads(subprocess.check_output(["git","show",BASE+":web/data/catalog.json"],cwd=ROOT))
    old = {q["id"]:q for q in former["questions"]}
    catalog = json.loads((ROOT/"web/data/catalog.json").read_text(encoding="utf-8"))
    rows = catalog["questions"]
    changed = {q["id"] for q in rows if q["id"] not in old or q["question"]!=old[q["id"]]["question"]}
    profiles=[]
    by_id={q["id"]:q for q in rows}
    for q in rows:
        right=next(o["text"] for o in q["options"] if o["id"]==q["correct_option_id"])
        profiles.append(Counter(terms(q["question"])*2+terms(right)*3+terms(q["explanation"])))
    frequency=Counter(term for words in profiles for term in words)
    postings=defaultdict(list)
    for i,words in enumerate(profiles):
        weights={w:(1+math.log(n))*math.log(1+len(rows)/frequency[w]) for w,n in words.items()}
        length=math.sqrt(sum(w*w for w in weights.values()))
        for term,weight in weights.items():
            postings[term].append((i,weight/length))
    scores=defaultdict(float)
    for group in postings.values():
        for (i,w),(j,v) in combinations(group,2):
            scores[i,j]+=w*v
    flags={}
    def flag(a,b,method):
        ids=tuple(sorted([a,b]))
        if changed.intersection(ids):
            flags.setdefault(ids,[]).append(method)
    for (i,j),score in scores.items():
        if score>=.35:flag(rows[i]["id"],rows[j]["id"],f"Gewichtete Wortähnlichkeit {score:.3f}")
    for match in candidates(rows):
        flag(match["a"],match["b"],"Lösungs- und Frageüberlappung")
    result=[dict(ids=ids,indiz=methods,fragen=[by_id[i]["question"] for i in ids]) for ids,methods in sorted(flags.items())]
    QA.mkdir(exist_ok=True,parents=True)
    (QA/"aehnliche-fragen.json").write_text(json.dumps(dict(katalog=catalog["version"],kandidaten=result),ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
    print(len(result),"Kandidaten zum Vergleich der konkreten Wissensziele")

if __name__=="__main__":
    main()
