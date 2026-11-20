"""Read public institutional sources into a local temporary research cache."""
import concurrent.futures
import csv
import hashlib
import json
import re
import sys
import tempfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parents[1]/"content"/"culture"
CACHE = Path(tempfile.gettempdir())/"quizsalon-culture-sources"
host_cache = Path.home()/"AppData"/"Local"/"Temp"/"quizsalon-culture-sources"
if host_cache.is_dir():
    CACHE = host_cache
CACHE.mkdir(exist_ok=True)
INDEX = BASE/"evidence"/"retrievals.json"


class Readable(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script","style"):
            self.hidden = True
        if tag in ("p","li","div","br","h1","h2","h3","tr","dt","dd","td"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script","style"):
            self.hidden = False
        if tag in ("p","li","div","h1","h2","h3","tr","td"):
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)

    def lines(self):
        return [re.sub(r"\s+"," ",l).strip() for l in "".join(self.parts).splitlines() if l.strip()]


def sources():
    rows = []
    for file in sorted((BASE/"work").glob("sources*.tsv")):
        with file.open(encoding="utf-8") as fh:
            rows += list(csv.reader(fh, delimiter="\t"))
    return {key:(title,url) for key,title,url in rows if key}


def get(entry):
    name,(title,url)=entry
    path=CACHE/name
    if path.exists() and name in previous:
        return name,previous[name]
    try:
        response=requests.get(url,timeout=30,headers={"User-Agent":"Mozilla/5.0 (compatible; Quizsalon source review)"})
        response.raise_for_status()
        material=response.content
        path.write_bytes(material)
        return name,dict(title=title,url=url,resolved=response.url,
            at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            sha256=hashlib.sha256(material).hexdigest(),bytes=len(material))
    except requests.RequestException as err:
        print(f"FAIL {name}: {err}",flush=True)
        return name,None


if __name__=="__main__":
    previous=json.loads(INDEX.read_text(encoding="utf-8")) if INDEX.exists() else {}
    selected=sources()
    if len(sys.argv)>1:
        selected={k:v for k,v in selected.items() if k in sys.argv[1:]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for name,meta in pool.map(get,selected.items()):
            if meta:
                previous[name]=meta
                print(f"OK {name} {meta['bytes']}",flush=True)
    INDEX.write_text(json.dumps(previous,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
