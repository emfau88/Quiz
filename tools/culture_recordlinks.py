"""Resolve public human-readable object records accompanying the institutional bulk data."""
import re
from culture_fetch import BASE,CACHE
from culture_series import seeds

urls=[]
for f in CACHE.glob("p[0-9]*"):
    links=re.findall(r'href="(/performances/\d+)"',f.read_text(encoding="utf-8"))
    if links:
        urls.append(("bes"+f.name[1:],"Wiener Staatsoper · Vorstellung und Besetzung","https://archiv.wiener-staatsoper.at"+links[0]))
for group in ["hsite","hdis","lart"]:
    for _,_,loc,_,_,_,_ in seeds(group):
        source,item,*rest=loc.split("/")
        if source=="whc": urls.append(("wh"+item,"UNESCO World Heritage Centre · Einzelobjekt","https://whc.unesco.org/en/list/"+item+"/"))
        if source=="nobel": urls.append(("nb"+item,"Nobel Prize Outreach · Einzeldatensatz","https://api.nobelprize.org/2.1/laureate/"+item))
        if source=="nationalgallery": urls.append(("nga"+item,"National Gallery of Art · Sammlungsobjekt","https://www.nga.gov/artworks/"+item))
urls.append(("bernie","Songwriters Hall of Fame · Bernie Taupin","https://www.songhall.org/inductees/bernie-taupin"))
(BASE/"work"/"sources-deep.tsv").write_text("\n".join("\t".join(row) for row in sorted(set(urls)))+"\n",encoding="utf8")
