"""Load the canonical item URLs from the public indices already read."""
import re
from culture_fetch import BASE,CACHE
from culture_indexes import index

works="""hauptmann_bahnwaerter_1892 hauptmann_weber_1892 heine_lieder_1827 heine_wintermaehrchen_1844
hoffmann_elixiere01_1815 humboldt_kosmos01_1845 keller_heinrich01_1854 keller_seldwyla_1856
moerike_mozart_1856 novalis_ofterdingen_1802 schiller_stuart_1801 spyri_heidi_1880 stifter_nachsommer01_1857
buechner_danton_1835 fontane_stechlin_1899 fontane_briest_1896 fontane_irrungen_1888 fontane_birnbaum_1885
fontane_brandenburg01_1862 gotthelf_sagen_1842 hebel_schatzkaestlein_1811 hoelderlin_hyperion01_1797
kafka_hungerkuenstler_1922 kleist_kaethchen_1810 kleist_krug_1811 lessing_emilia_1772 lessing_minna_1767
mommsen_roemische01_1854 schiller_kabale_1784 schiller_tell_1804 schnitzler_liebelei_1896 schnitzler_traumnovelle_1926
storm_schimmelreiter_1888 storm_immensee_1852 chamisso_schlemihl_1814 droste_judenbuche_1910 eichendorff_taugenichts_1826
goethe_werther01_1774 goethe_iphigenie_1787 grimm_maerchen01_1812 hauptmann_sonnenaufgang_1889
fontane_tweed_1860 heine_reisebilder01_1826""".split()
operas=set("""8 51 59 531 18 37 110 121 140 2 161 274 176 184 32 267 62 66 816 160 663 202 61 115 128 188 230 10 1134 46 152 47 208 183 123 151 175 146 186""".split())
ich=set("""01596 01607 00363 00258 00575 02106 02130 02115 02116 02120 01991 02118 02102 01954 01956 01564 01961 01987 01967 01574 01717 01687 01708 01560 01568 01602 01471 01461 01365 01378 01263 01370 00892 01010 00951 00873 00881 00645 00869 00421 00396 00395 00219 00225 00265 00170 00180 00245 00163 00010 00064 00011 00063 02291 00693 00619 00726 00729 00534 00356 00252 00033 00003 00051 01852 00799 00435 01257""".split())
out=[]
for kind,names,publisher,prefix in (("dta",set(works),"Deutsches Textarchiv","b"),("wien",operas,"Wiener Staatsoper · Spielplanarchiv","v"),("ich",ich,"UNESCO · Immaterielles Kulturerbe","i")):
    for url,title in index(kind).items():
        ident=url.split("/")[-1].split("-")[-1] if kind=="ich" else url.split("/")[-1]
        if ident in names:
            out.append((prefix+ident,publisher+" · "+title.split(". In:")[0][:90],url))
gramfile=(CACHE/"grambasis").read_text(encoding="utf-8")
for url,name in re.findall(r'<a href="(/vggf/\d+)"[^>]*>([^<>]+)</a>',gramfile):
    out.append(("g"+url.split("/")[-1],"Leibniz-Institut für Deutsche Sprache · "+name,"https://grammis.ids-mannheim.de"+url))
(BASE/"work"/"sources-item.tsv").write_text("\n".join("\t".join(r) for r in sorted(set(out)))+"\n",encoding="utf-8")
