"""Compose a collection from individually selected records; answers use stable field meanings."""
import csv
import hashlib
import json
import random
import re
import sys
import html
from pathlib import Path
from xml.etree import ElementTree

from culture_select import BASE,CACHE,INDEX,CATEGORIES,norm,resolve

QUOTAS={
    "hsite":(42,21,7),"hdis":(24,12,4),"htime":(39,20,6),
    "escene":(39,20,6),"emusic":(29,15,5),"estage":(20,10,3),"eother":(17,8,3),
    "lword":(26,13,4),"lbooks":(25,13,4),"lart":(15,8,2),"ltrad":(23,12,4),"lgram":(16,7,3),
}


def choices(key,answer,pool):
    candidates=sorted(set(pool)-{answer})
    return [answer]+random.Random(key).sample(candidates,3)


def row(group,key,rank,q,opt,exp,title,url,at):
    return dict(fact_key=key,rank=int(rank),category=CATEGORIES[group[0]],question=q,choices=opt,
                explanation=exp,title=title,url=url,checked_at=at)


def seeds(group):
    for line in (BASE/"work"/f"{group}.tsv").read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            yield line.split("|")


def handmade(group):
    for key,rank,loc,anchors,q,opts,exp in seeds(group):
        title,url,at,content=resolve(loc)
        for anchor in anchors.split("~"):
            if norm(anchor) not in content:
                raise ValueError(f"{key} {loc}: Belegzeichen {anchor!r} fehlt")
        item=row(group,key,rank,q,opts.split("^"),exp,title,url,at)
        if loc.startswith("lemo"):
            item["tags"]=["damals_und_heute"]
        yield item


def oscars(group):
    docs={str(d["year"]):d for d in json.loads((BASE/"evidence"/"academy-award-records.json").read_text(encoding="utf-8"))}
    categories={"HL":"Actor in a Leading Role","HN":"Actor in a Supporting Role","DL":"Actress in a Leading Role",
                "DN":"Actress in a Supporting Role","R":"Directing","F":"Best Picture"}
    labels={"HL":"bester Hauptdarsteller","HN":"bester Nebendarsteller","DL":"beste Hauptdarstellerin",
            "DN":"beste Nebendarstellerin","R":"beste Regie","F":"bester Film"}
    ready=[]
    for year,code,rank,direction,film,original in seeds(group):
        d=docs[year]
        rec=next(x for x in d["awards"] if x["category"]==categories[code])
        person,en=(rec["b"],rec["a"]) if code in {"F","R"} else (rec["a"],rec["b"])
        assert norm(en)==norm(original), (year,code,rec,original)
        person={"Milos Forman":"Miloš Forman","Cuba Gooding, Jr.":"Cuba Gooding Jr."}.get(person,person)
        ready.append((year,code,rank,direction,film,person,d))
    for year,code,rank,direction,film,person,d in ready:
        key=f"academy.{year}.{code.lower()}"
        label=labels[code]
        if code=="F":
            q=f"Welcher dieser Filme gewann bei der Oscarverleihung {year} als bester Film?"
            opt=choices(key,film,[r[4] for r in ready if r[1]=="F"])
            exp=f"„{film}“ erhielt {year} die Auszeichnung für den besten Film."
        elif code=="R":
            q=f"Wer erhielt für „{film}“ den Regie-Oscar?"
            opt=choices(key,person,[r[5] for r in ready if r[1]=="R"]+["Steven Spielberg","Billy Wilder","Clint Eastwood","Ang Lee"])
            exp=f"Die Academy zeichnete {person} bei der Verleihung {year} für die Regie von „{film}“ aus."
        elif direction=="film":
            q=f"Für welchen Film erhielt {person} {year} den Oscar als {label}?"
            opt=choices(key,film,[r[4] for r in ready if abs(int(r[0])-int(year))<=20])
            exp=f"{person} wurde {year} für die Rolle in „{film}“ ausgezeichnet."
        else:
            q=f"Wer gewann für „{film}“ den Oscar als {label}?"
            persons=[r[5] for r in ready if r[1][0]==code[0] and r[1] not in {"F","R"}]
            opt=choices(key,person,persons)
            exp=f"Für die Darstellung in „{film}“ erhielt {person} bei der Preisverleihung {year} den Oscar."
        yield row(group,key,rank,q,opt,exp,f"Academy of Motion Picture Arts and Sciences · Oscarverleihung {year}",d["url"],d["at"])


def books(group):
    index={}
    metadata=json.loads(INDEX.read_text(encoding="utf-8"))
    for name,meta in metadata.items():
        if not re.fullmatch(r"dta(?:\d+|full)?",name):
            continue
        for url,title in re.findall(r'<a href="(https://www.deutschestextarchiv.de/book/show/[^"]+)">([^<]+)</a>',(CACHE/name).read_text(encoding="utf-8")):
            index[url.rsplit("/",1)[1]]=(html.unescape(title),meta)
    data=list(seeds(group))
    for key,rank,author,work,anchor,detail,form in data:
        heading,meta=index[key]
        assert norm(anchor) in norm(heading) and norm(author.split()[-1].split("-")[0]) in norm(heading),(key,heading,anchor,author)
        if form=="a":
            q=f"Wer schrieb „{work}“?"
            opts=choices(key,author,[v[2] for v in data if v[2]!=author])
            if key.startswith("grimm_maerchen"):
                q="Wer gab ab 1812 die Sammlung „Kinder- und Hausmärchen“ heraus?"
            if key.startswith("mommsen_roemische"):
                q="Welcher Historiker veröffentlichte 1854 in Leipzig den ersten Band seiner „Römischen Geschichte“?"
        else:
            year=key.rsplit("_",1)[1]
            q=f"Welchen dieser Titel von {author} verzeichnet das Deutsche Textarchiv in einer Ausgabe von {year}?"
            opts=choices(key,work,[v[3] for v in data if v[2]!=author])
        yield row(group,"dta."+key,rank,q,opts,detail,meta["title"]+" · "+work,meta["url"],meta["at"])


LANGS={"de":"Deutschen","en":"Englischen","fr":"Französischen","it":"Italienischen","es":"Spanischen","pt":"Portugiesischen",
       "nl":"Niederländischen","sv":"Schwedischen","no":"Norwegischen","da":"Dänischen","fi":"Finnischen","pl":"Polnischen",
       "el":"Griechischen","cs":"Tschechischen","tr":"Türkischen","hu":"Ungarischen","hr":"Kroatischen","ro":"Rumänischen",
       "is":"Isländischen","ja":"Japanischen","sw":"Swahili"}


def word_entry(root,kind,code):
    paths={"territory":f"./localeDisplayNames/territories/territory[@type='{code}']",
           "language":f"./localeDisplayNames/languages/language[@type='{code}']",
           "script":f"./localeDisplayNames/scripts/script[@type='{code}']",
           "month":f".//calendar[@type='gregorian']/months/monthContext[@type='format']/monthWidth[@type='wide']/month[@type='{code}']",
           "day":f".//calendar[@type='gregorian']/days/dayContext[@type='format']/dayWidth[@type='wide']/day[@type='{code}']",
           "relative":f"./dates/fields/field[@type='day']/relative[@type='{code}']",
           "unit":f"./units/unitLength[@type='long']/unit[@type='{code}']/displayName",
           "field":f"./dates/fields/field[@type='{code}']/displayName"}
    return root.findtext(paths[kind])


def words(group):
    meta=json.loads(INDEX.read_text(encoding="utf-8"))
    for lang,kind,code,rank,locword,ans,alternatives in seeds(group):
        key=f"cldr.{lang}.{kind}.{code}".replace("+","plus").lower()
        local=word_entry(ElementTree.parse(CACHE/("cl"+lang)).getroot(),kind,code)
        german=word_entry(ElementTree.parse(CACHE/"clde").getroot(),kind,code)
        assert local and german and norm(local)==norm(locword),(lang,kind,code,locword,local,german)
        assert norm(german)==norm(ans),(lang,code,german,ans)
        label=LANGS[lang]
        qs={"territory":"Welches Land heißt im","language":"Welche Sprache heißt im","script":"Welche Schrift heißt im",
            "month":"Welcher Monat heißt im","day":"Welcher Wochentag heißt im"}
        q=(f"{qs[kind]} {label} „{locword}“?" if kind in qs else f"Was bedeutet „{locword}“ im {label}?")
        if kind in {"field","unit"} and code not in {"length-kilometer"}:
            q=f"Welche Zeiteinheit bezeichnet „{locword}“ im {label}?"
        if kind=="day":
            exp=f"Auf einem Kalender entspricht „{locword}“ dem deutschen „{ans}“."
        elif kind=="month":
            exp=f"„{locword}“ bezeichnet den {int(code)}. Monat des Jahres, also den {ans}."
        else:
            exp=f"„{locword}“ ist im {label} die Bezeichnung für „{ans}“."
        m=meta["cl"+lang]
        yield row(group,key,rank,q,[ans]+alternatives.split("^"),exp,m["title"],m["url"],m["at"])


def publish_work(group,items):
    items=list(items)
    e,m,h=QUOTAS[group]
    assert len(items)==e+m+h,(group,len(items),e+m+h)
    for i,item in enumerate(sorted(items,key=lambda x:x["rank"])):
        item["difficulty"]="easy" if i<e else "medium" if i<e+m else "hard"
    path=BASE/"work"/f"{group}.jsonl"
    path.write_text("\n".join(json.dumps(r,ensure_ascii=False) for r in items)+"\n",encoding="utf-8")
    print(f"{group}: {len(items)} Einzelbelege")


if __name__=="__main__":
    name=sys.argv[1]
    runner={"escene":oscars,"lbooks":books,"lword":words}.get(name,handmade)
    publish_work(name,runner(name))
