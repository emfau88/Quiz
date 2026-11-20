"""Focus a local source read on particular entries, leaving copyrighted texts in the cache."""
import argparse
import csv
import json
import re
import sys
from xml.etree import ElementTree

from culture_fetch import CACHE, Readable


def text_rows(name, raw):
    text=raw.decode("utf-8-sig",errors="replace")
    if name=="nobel":
        for p in json.loads(text)["laureates"]:
            for a in p["nobelPrizes"]:
                yield " | ".join((p["id"],p.get("knownName",p.get("orgName",{}))["en"],
                    a["awardYear"],a["category"]["en"],a["motivation"]["en"]))
    elif name=="whc":
        for e in ElementTree.fromstring(text).findall(".//row"):
            desc=re.sub("<[^>]*>", "", e.findtext("short_description") or "")
            yield " | ".join((e.findtext("id_number") or "",e.findtext("site") or "",e.findtext("states") or "",desc))
    elif name=="nationalgallery":
        for r in csv.DictReader(text.splitlines()):
            yield " | ".join(r.get(k,"") for k in ("objectid","title","attribution","displaydate","medium","classification"))
    elif name=="pg":
        for r in csv.DictReader(text.splitlines()):
            yield " | ".join(r.values())
    else:
        h=Readable()
        h.feed(text)
        yield from h.lines()


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("name");p.add_argument("expression",nargs="?",default=".")
    p.add_argument("--limit",type=int,default=60)
    p.add_argument("--width",type=int,default=450)
    args=p.parse_args()
    for name in CACHE.glob(args.name):
        filtered=(r for r in text_rows(name.name,name.read_bytes()) if re.search(args.expression,r,re.I))
        from itertools import islice
        for row in islice(filtered,args.limit):
            print(name.name,row[:args.width])
