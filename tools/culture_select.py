"""Match hand-authored question cards to the actual source record before editing."""
import csv
import functools
import html
import json
import re
import sys
import unicodedata
from pathlib import Path
from xml.etree import ElementTree

from culture_fetch import BASE,CACHE,INDEX,Readable
from culture_read import text_rows

CATEGORIES={"h":"history_discoveries","e":"entertainment","l":"language_culture"}
LEVELS={"e":"easy","m":"medium","h":"hard"}


def norm(s):
    return " ".join("".join(c for c in unicodedata.normalize("NFKD",html.unescape(s).casefold())
                            if not unicodedata.combining(c)).split())


@functools.lru_cache(maxsize=None)
def material(source):
    if source=="nationalgallery":
        return {r["objectid"]:r for r in csv.DictReader((CACHE/source).open(encoding="utf-8-sig"))}
    raw=(CACHE/source).read_bytes()
    if source=="whc":
        return {e.findtext("id_number"):e for e in ElementTree.fromstring(raw).findall(".//row")}
    if source=="nobel":
        return {p["id"]:p for p in json.loads(raw)["laureates"]}
    return " ".join(text_rows(source,raw))


def resolve(locator):
    src,*sub=locator.split("/")
    registry=json.loads(INDEX.read_text(encoding="utf-8"))
    meta=registry[src]
    value=material(src)
    title,url=meta["title"],meta["url"]
    if src=="whc":
        e=value[sub[0]]
        value=" ".join(re.sub(r"<[^>]*>", "",e.findtext(k) or "") for k in ("site","states","short_description"))
        title+=" · "+e.findtext("site")
        individual="wh"+sub[0]
        if individual in registry:
            individual_text=material(individual)
            if norm(e.findtext("site")) in norm(individual_text):
                meta=registry[individual]
                value=individual_text
                url=meta["url"]
    elif src=="nobel":
        p=value[sub[0]]
        award=next(a for a in p["nobelPrizes"] if a["awardYear"]==sub[1])
        value=(p.get("knownName",p.get("orgName",{}))["en"]+" "+award["awardYear"]+" "+
               award["category"]["en"]+" "+award["motivation"]["en"])
        title+=" · "+p.get("knownName",p.get("orgName",{}))["en"]+", "+award["awardYear"]
        individual="nb"+sub[0]
        if individual in registry:
            details=json.loads((CACHE/individual).read_text(encoding="utf-8"))
            rows=details if isinstance(details,list) else details.get("laureates",[])
            record=next((r for r in rows if r["id"]==sub[0]),None)
            direct_award=next((a for a in (record or {}).get("nobelPrizes",[]) if a["awardYear"]==sub[1]),None)
            person_name=p.get("knownName",p.get("orgName",{}))["en"]
            if direct_award and record.get("knownName",record.get("orgName",{})).get("en")==person_name and all(
                direct_award[field]["en"]==award[field]["en"] for field in ("category","motivation")
            ):
                meta=registry[individual]
                url=meta["url"]
    elif src=="nationalgallery":
        item=value[sub[0]]
        value=" ".join(item[k] for k in ("title","medium","displaydate","attribution","classification"))
        title+=" · "+item["title"]
    return title,url,meta["at"],norm(value)


def select(batch):
    lines=(BASE/"work"/f"{batch}.cards").read_text(encoding="utf-8").splitlines()
    out=[]
    for line in lines:
        if not line or line.startswith("#"):
            continue
        c,d,key,source,anchors,q,a,explanation=line.split("|")
        title,url,at,document=resolve(source)
        for anchor in anchors.split("~"):
            if norm(anchor) not in document:
                raise ValueError(f"{key}: Beleganker {anchor!r} fehlt in {source}")
        out.append(dict(fact_key=key,category=CATEGORIES[c],difficulty=LEVELS[d],question=q,choices=a.split("^"),
            explanation=explanation,title=title,url=url,checked_at=at,reference=batch.startswith("reference"),
            tags=["damals_und_heute"] if source.startswith("lemo") else []))
    (BASE/"work"/f"{batch}.jsonl").write_text("\n".join(json.dumps(row,ensure_ascii=False) for row in out)+"\n",encoding="utf-8")
    print(f"{len(out)} belegte Sachverhalte abgeglichen.")


if __name__=="__main__":
    select(sys.argv[1])
