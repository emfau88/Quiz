"""Inspect authoritative catalogue headings and follow only a chosen record."""
import html
import re
import sys
from culture_fetch import CACHE


def index(kind):
    d={}
    if kind=="dta":
        files=list(CACHE.glob("dta*"))
        pattern=r'<a href="(https://www.deutschestextarchiv.de/book/show/[^"]+)">([^<]+)</a>'
        prefix=""
    elif kind=="wien":
        files=[CACHE/"werke",*CACHE.glob("wseite*")]
        pattern=r'<a href="(/search/work/[^"]+)"[^>]*>\s*<h2><span class="play-title">(.*?)</span>'
        prefix="https://archiv.wiener-staatsoper.at"
    else:
        files=[CACHE/"unescoich"]
        pattern=r'<a class="link" href="(https://ich.unesco.org/en/(?:RL|USL)/[^"]+)" title="Reference:[^"]+">([^<]+)</a>'
        prefix=""
    for f in files:
        for url,title in re.findall(pattern,f.read_text(encoding="utf-8"),re.S):
            d[prefix+url]=html.unescape(title).strip()
    return d


if __name__=="__main__":
    for url,title in index(sys.argv[1]).items():
        if re.search(sys.argv[2],url+" "+title,re.I):
            print(url.split("/")[-1],title[:130])
