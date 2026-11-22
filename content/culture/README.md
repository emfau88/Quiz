# Inhaltsberichte für Geschichte, Unterhaltung, Sprache und Kultur

## Deutsche Ausgabe 0.3.0

Geschichte, Unterhaltung und Sprache umfassen jeweils 400 aktive Fragen. Je Kategorie stammen 294 neue Sachverhalte aus der Fachredaktion und sechs aus der Forschungsredaktion. Die übrigen 100 sind aus der Vorversion übernommen. [Redaktion Geschichte und Unterhaltung](evidence/03/README.md) · [Prüfprotokoll Sprache und Kultur](evidence/03-modern-sprache-pruefung.json) · [Forschungsfragen](../research/README.md)

## Austausch der Ausgabe 0.2.0

Am 22. November 2026 ergänzte die Unterhaltungsredaktion 48 Fragen zu deutschsprachigem Fernsehen und Radio, Popmusik, Filmhandlungen und Sportübertragungen. Dafür gingen 35 der 65 Oscar-Zuordnungen und 13 der 33 Bühnenfragen der Ausgangsserien ins Archiv. Jedes der 48 Austauschpaare bewahrt die Schwierigkeitsstufe. Die Redaktion öffnete 49 Belegseiten und las jede Karte in einem zweiten Durchgang. [Unterhaltungsfragen](2026-11-unterhaltung.json) · [Einzelbelege und Textprüfung](evidence/2026-11-unterhaltung-pruefung.json) · [Austauschpaare](../rotation/2026-11/unterhaltung.json)

Der Gesamtprüfer für die Rotation vergleicht den neuen Offline-Katalog mit der ausgelieferten Ausgangsversion. Er prüft alle sechs Kategorien und weist übernommene, archivierte und neue Karten aus. [Prüfung der Rotation](../../tools/audit_pool.py)

## Ausgangsbericht vom 20. November 2026

Die drei Ressorts lieferten **600 aktive Fragen mit 600 verschiedenen Sachverhalten**. Der Ausgangsbestand enthielt 75 Referenzfragen und 12 Starter. Die Quellenprüfungen und Textabnahmen stammen von der im Datensatz genannten Codex-Redaktion. Für menschliche Rückmeldungen lagen **0 Beobachtungen** vor. Die Schwierigkeit war eine redaktionelle Einschätzung.

| Kategorie | Aktiv | Leicht | Mittel | Anspruchsvoll | Referenz leicht / mittel / anspruchsvoll |
| --- | ---: | ---: | ---: | ---: | --- |
| Geschichte und Entdeckungen | 200 | 120 | 60 | 20 | 15 / 7 / 3 |
| Film, Musik und Fernsehen | 200 | 120 | 60 | 20 | 15 / 7 / 3 |
| Sprache und Kultur | 200 | 120 | 60 | 20 | 15 / 7 / 3 |

## Freigaben und Nachweise

Am 20. November 2026 um 01:10 UTC stand der Starter mit vier Fragen je Kategorie bereit. Um 01:17 UTC ergänzten 63 weitere Fragen den Referenzbestand. Die danach freigegebenen 525 Erweiterungsfragen verwenden 12 Themenserien. Jeder freigegebene Datensatz enthält den überprüften Sachverhalt, Quellenadresse, Abrufzeit, zwei Prüfungseinträge und die Freigabe zur jeweiligen Inhaltsversion.

Für die Abschlussprüfung am 20. November um 02:00 UTC wurden alle 600 Datensätze am Projekt-Schema mit aktivierter Formatprüfung gemessen. Die 525 Erweiterungsfragen wurden aus den tatsächlich geöffneten Quellen erneut abgeglichen. Der Bericht weist 388 verschiedene Quellenadressen aus. Ein Sammelkatalog kann viele individuell geprüfte Sachverhalte belegen. Im Wortähnlichkeitsvergleich standen alle 1.200 aktiven Fragen des Gesamtprojekts. [Abschlussprüfung](evidence/abschlusspruefung.json)

| Datei oder Serie | Fragen | Verschiedene Quellenadressen in dieser Gruppe | Prüfung |
| --- | ---: | ---: | --- |
| Starter | 12 | 7 | LeMO-Ereignisse 1969/1989, Oscarverleihung 1998 und vier Einzelwerke des Deutschen Textarchivs geöffnet und inhaltlich gelesen |
| Zusätzliche Referenzen | 63 | 35 | Für jedes Thema einen Jahreschronikeintrag, Katalogdatensatz, Werktext oder Fachartikel geöffnet. Belegstellen, Antwortauswahl und Erklärung einzeln zugeordnet |
| hsite | 70 | 70 | Jedem historischen Ort die offizielle UNESCO-ID zugeordnet. Merkmale und historische Zusammenhänge auf den einzelnen Welterbeseiten geprüft |
| hdis | 40 | 40 | Für jeden Nobelpreis die ausgezeichnete Person, das Jahr, das Fach und die Begründung im Sammeldatensatz und im Datensatz zur einzelnen Person abgeglichen |
| htime | 65 | 51 | Zeitfolge, beteiligte Personen und Sachverhalte gegen die einschlägigen Jahreschroniken von LeMO geprüft |
| escene | 65 | 34 | Einzelauszeichnungen der Academy auf den Seiten der jeweiligen Verleihung geprüft. Kategorie, Gewinner, Film und Jahr im Arbeitsbeleg zugeordnet |
| emusic | 49 | 39 | Musikstücke, Personen, Gruppen, Instrumente und Zeitangaben gegen Künstlerporträts der Rock & Roll Hall of Fame, den Beatles-Werkkatalog und LeMO geprüft |
| estage | 33 | 30 | Werke und Rollenbesetzungen im Archiv der Wiener Staatsoper, der Oper Rom sowie in den Produktionsbeschreibungen von OperaVision geprüft |
| eother | 28 | 28 | Deutsche Film- und Fernsehgeschichte in LeMO, internationale Spiel- und Musikformen in den jeweiligen UNESCO-Einträgen geprüft |
| lbooks | 42 | 13 | Autor, Titel und gegebenenfalls Erscheinungsjahr oder Erscheinungsort im bibliografischen Datensatz des Deutschen Textarchivs geprüft. Die zitierte Liste enthält den jeweiligen geprüften Titel |
| lword | 43 | 15 | Sprachen-, Kalender- und Einheitenbezeichnungen zwischen der jeweiligen Sprachdatei und dem deutschen Referenzfeld in Unicode CLDR 47 abgeglichen |
| lart | 25 | 1 | Für jedes Kunstwerk die Objekt-ID im Sammlungsdatensatz der National Gallery of Art aufgelöst. Titel, Zuschreibung, Datierung oder Medium abhängig von der Frage geprüft |
| ltrad | 39 | 39 | Werkstoffe, Gebrauch oder regionale Zuordnung der einzelnen Techniken, Gerichte und Bräuche im jeweiligen UNESCO-Eintrag geprüft |
| lgram | 26 | 26 | Jeweils den passenden Fachartikel im Grammatischen Informationssystem des Leibniz-Instituts für Deutsche Sprache geprüft und mit einem selbst formulierten deutschen Beispiel verbunden |

## Zweiter Durchgang

Die Arbeitsfassungen und die zugehörigen Belegstellen liegen in [work](work/). Der erste Prüfschritt verbindet jede Fassung mit ihrem SHA-256-Fingerabdruck. Für die anschließende Textprüfung wurden Frage, alle vier Antworttexte und Erklärung nochmals nebeneinander gelesen und die Alternativen auf eindeutige Abgrenzung geprüft. Die Freigabe kontrolliert den Fingerabdruck erneut. [Prüfwerkzeug](../../tools/culture_editor.py) · [Protokolle nach Themenserie](evidence/)

Dabei wurde etwa bei den Grimms die Herausgeberschaft der Märchensammlung präzisiert. Bei mehrdeutigen fremdsprachigen Wörtern wie „ay“ und „segundo“ nennt die Frage jetzt den Bedeutungsbereich. Für die Rossini-Frage dokumentiert das Archiv der Oper Rom neben dem Komponisten und den Figuren auch das Jahr der Uraufführung. Eine zunächst vorgesehene Liedfrage mit unzureichendem Beleg ersetzte eine nachgewiesene Frage zur Ausbürgerung Wolf Biermanns.

Der automatische Vergleich meldete nach der gemeinsamen Durchsicht acht Wortähnlichkeiten mit Beteiligung dieser Ressorts. Eine betrifft zwei verschiedene Oscar-Auszeichnungen von Tom Hanks, für „Philadelphia“ und „Forrest Gump“. Die anderen sieben betreffen unabhängig gebräuchliche Wörter verschiedener Sprachen mit derselben deutschen Übersetzung. Sprachpaar und fremdsprachiger Ausdruck sind in jeder dieser Fragen eindeutig. Zusätzlich wurden die historische Welterbeserie und die Reise-Welterbeserie vollständig auf gleiche Aussagen gegengelesen.

| Vorbereitete Erweiterungsfrage | Entscheidung vor dem endgültigen Releaseexport |
| --- | --- |
| k-thebes-karnak | Die Reise-Erweiterung behandelt dieselbe Zuordnung. Geschichte erhielt den neuen Sachverhalt k-weimar-klassik-poets. [Frühere Fassung](evidence/archive-thebes-karnak.json) |
| k-lascaux-paintings | Die Reise-Erweiterung behandelt die Höhlenmalerei in Lascaux. Geschichte erhielt k-maulbronn-community. [Frühere Fassung](evidence/archive-lascaux-paintings.json) |
| k-speyer-romanesque | Die Reise-Erweiterung behandelt bereits den Baustil des Speyerer Doms. Geschichte erhielt k-naumburg-figures. [Frühere Fassung](evidence/archive-speyer-romanesque.json) |
| k-france-versailles-residents | Die ursprüngliche Referenzfrage bleibt erhalten. Die Reise-Erweiterung ersetzt ihren zweiten Eintrag über die Residenz durch einen neuen Sachverhalt zu Surtsey. |

Die drei archivierten Fragen gehörten zum internen Ausbau. Ihre Aussagen waren sachlich richtig. Die 12 Starterkarten und sämtliche 75 ursprünglichen Referenzfragen dieses Verzeichnisses haben ihre Identitäten und Revisionen behalten. Künftige inhaltliche Korrekturen an ausgelieferten Fragen erfordern zwei neu protokollierte Prüfdurchgänge und die Revisionsbehandlung der zentralen Content-Spezifikation.

## Quellen und Nutzercredits

**Sprachdaten.** Unicode Common Locale Data Repository, Release 47. Copyright © 2004–2025 Unicode, Inc. Der Copyright- und Erlaubnishinweis dieser Ausgabe liegt im Original bei. [Unicode License v3](licenses/Unicode-3.0.txt) · [Original zur Ausgabe 47](https://raw.githubusercontent.com/unicode-org/cldr/release-47/LICENSE)

**Nobelpreisdaten.** Nobel Prize API 2.1, Nobel Prize Outreach. Die spezifischen Nutzungsbedingungen stellen die Services unter CC0 und empfehlen die Nennung als Datenquelle. Die Fragen verwenden ausgewählte Preisfakten und eigenständig formulierte deutsche Erläuterungen. [API-Nutzungsbedingungen](https://www.nobelprize.org/about/terms-of-use-for-api-nobelprize-org-and-data-nobelprize-org/)

**Kunstsammlung.** Courtesy National Gallery of Art, Washington. Public Domain Collection Dataset, CC0 1.0. Im Quiz erscheinen die redaktionell ausgewerteten Werkdaten. [Open-Data-Erklärung des Museums](https://www.nga.gov/artworks/free-images-and-open-access) · [CC0 1.0](licenses/CC0-1.0.txt)

**Weitere redaktionelle Belege.** LeMO des Deutschen Historischen Museums und der Stiftung Haus der Geschichte, UNESCO World Heritage Centre und UNESCO Intangible Cultural Heritage, Deutsches Textarchiv der Berlin-Brandenburgischen Akademie der Wissenschaften, Leibniz-Institut für Deutsche Sprache, Academy of Motion Picture Arts and Sciences, Rock & Roll Hall of Fame, The Beatles, Wiener Staatsoper, Teatro dell’Opera di Roma und OperaVision. Die Einzelfragen nennen die jeweils tatsächlich konsultierte Seite. Aus diesen Quellen wurden sachliche Einzelangaben, Werktitel und Namen für eigene Fragen und Erklärungen ausgewertet. Fotos, Filmstills, Originalmusik und Faksimiles gehören nicht zum Fragenmaterial.

## Recherchedateien

Die Redaktion speicherte Originalantworten der Quellen für die lokale Sichtung in einem temporären Recherchecache. Im [Abrufverzeichnis](evidence/retrievals.json) stehen URL, tatsächlicher Abrufzeitpunkt, Größe und SHA-256 der heruntergeladenen Antworten. Es verzeichnet auch während der Recherche betrachtete Kandidaten. Eine dort verzeichnete HTTP-Antwort allein gilt nicht als Quellenprüfung. Leere oder vorgeschaltete Challenge-Seiten wurden verworfen. Entscheidend für den Export sind der abgeglichene Sachverhalt im Einzeldatensatz, die Textabnahme und die aktive Freigabe. Bei den Oscarverleihungen und den ersten Starterkarten ergänzte eine direkte Browserlektüre den lokalen Abruf. [Ausgelesene Preisdatensätze](evidence/academy-award-records.json)

`python -X utf8 tools/culture_audit.py` vergleicht die damaligen Arbeitsfassungen und ihre Fingerabdrücke mit den 600 Ressortkarten im gesicherten 1.0-Katalog. Er wiederholt den damaligen Vergleich über alle 1.200 Karten, prüft das Redaktionsschema der zugehörigen Quelldateien und liest den ursprünglichen Abschlussbericht zur Kontrolle. Die vertiefte Quellenprüfung nutzt den lokalen Recherchecache. Der zentrale Compiler baut den aktuellen Offline-Katalog aus den freigegebenen JSON-Dateien und den Austauschlisten. [Prüfung des Ausgangsstands](../../tools/culture_audit.py) · [Prüfung der Rotation](../../tools/audit_pool.py) · [Zentraler Compiler](../../tools/catalog.py)
