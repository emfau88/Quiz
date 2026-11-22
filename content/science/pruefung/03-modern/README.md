# Redaktionelle Freigabe für Natur und Reisegeografie in Ausgabe 0.3

Am 22. November 2026 erhielten 588 neu formulierte deutschsprachige Quizkarten ihre redaktionelle Agentenfreigabe. Die beiden Bereiche ergänzen den Bestand jeweils um 294 Karten.

| Bereich | Leicht | Mittel | Schwer | Herleiten | Schätzen | Vergleichen | Zeitlich einordnen | Anwenden |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Geografie und Reisen | 176 | 88 | 30 | 112 | 36 | 20 | 32 | 94 |
| Natur und Tiere | 176 | 88 | 30 | 107 | 29 | 39 | 31 | 88 |

Die Reisekarten umfassen 34 Hauptunterthemen. Dazu gehören die Orientierung auf Wanderwegen und Seekarten, Verkehrsbauwerke, Flussläufe und die Entstehung von Landschaften. Bei Natur und Tieren verteilen sich die Karten auf 45 Hauptunterthemen, etwa auf Vogelbeobachtung, die Entwicklung von Insekten, Wetter, Küstenlebensräume und den Nachthimmel. Alle 219 Hinweisfragen tragen die Kennzeichnung `tagesraetsel`.

## Entstehung und zweite Prüfung

1. Für jede Karte wurde mindestens eine Seite einer zuständigen Institution, eines Fachverbands, einer Forschungseinrichtung oder eines Betreibers geöffnet. Die redaktionelle Arbeitskopie erfasst Titel, Originaladresse, Abrufzeit und die ausgewählten Zeilen. Bei PDF-Dateien enthält der Verweis auch die Seite. Beispiele sind das phänologische Beobachterhandbuch des Deutschen Wetterdienstes, der Artenbericht zum Baumschläfer des Bundesamts für Naturschutz und die Dokumentation der jeweiligen Welterbestätten des UNESCO World Heritage Centre.
2. Der Sachabgleich ordnete Frage, Lösung und Erklärung diesen Fundstellen zu. Rechenfragen erhielten anhand der geprüften Größen einen eigenen Alltagsvergleich. Zeiten, Bezugsräume und Bedingungen wurden dort in die Frage aufgenommen, wo sie für eine eindeutige Lösung nötig sind. Die Machu-Picchu-Karte belegt den Standort und die Mündung des Amazonas mit zwei getrennten Institutionen.
3. Nach dem Sachabgleich wurden die verwendeten Fundstellen nochmals aufgerufen. Die Prüfunterlagen verzeichnen für jede Stelle den Zeitpunkt dieser Bestätigung. Sie umfassen 1.208 Stellenzuordnungen zu 1.016 unterschiedlichen Kombinationen aus Adresse und Zeile.
4. Derselbe Agent las die Fragen anschließend in einem eigenen Redaktionsdurchgang in 42 Gruppen zu je 14 Karten. Für jede Karte hielt er die geprüfte Besonderheit in einem eigenen Vermerk fest. Dabei verbesserte er unter anderem die Optionen zum Tierverhalten, prüfte die Größenordnungen der Schätzfragen und ersetzte sachgleiche oder bereits im Fragetext verratene Lösungen. Beim Orion verlangt die Orientierungsaufgabe nun den Weg vom Gürtel zu den Schultern. Diese Richtungsbeziehung wurde einzeln erneut auf der NASA-Seite aufgerufen.
5. Die beiden Freigabedateien entstanden nach Abschluss der jeweiligen Zweitlesung. Der Prüfer verglich ihre Öffnungs-, Sachprüfungs-, Bestätigungs-, Zweitlesungs- und Freigabezeiten. Er prüfte außerdem die vier Antwortmöglichkeiten, den Lösungsschlüssel, die Längen, die Frageform, die täglichen Hinweisfragen und die Normalformen von Fragen, Sachverhaltsschlüsseln und IDs. Beim Durchlauf mit den lokalen Arbeitskopien stimmten alle 589 Fingerabdrücke der Quellenauszüge mit den Einzelbelegen überein.

Die Zeitstempel sind in UTC angegeben. Wie schwer Spielerinnen und Spieler einzelne Fragen finden und wie gut sie die Antwortmöglichkeiten und Alltagssituationen verstehen, bleibt Gegenstand der Erprobung mit der Zielgruppe. Die Felder für menschliche Beobachtungen sind in diesen Datensätzen leer.

## Quellen und Nutzung

Das Quellenregister nennt für jede der 242 Originaladressen den Herausgeber, den Seitentitel und die zugehörigen Quiz-IDs. Geografie nutzt 140 verschiedene Adressen und Natur 102. Im Register sind 56 Herausgeberbezeichnungen vertreten, darunter auch Fachabteilungen derselben Einrichtung. [Quellenregister](quellen.json)

Die Karten verwenden die belegten Sachangaben in eigenen deutschen Formulierungen. Die App kann Titel und Quelle anzeigen. Die Rechte für Artikeltexte, Fotografien, Illustrationen, Karten und Logos liegen bei den jeweiligen Rechteinhabern. Diese redaktionelle Lieferung umfasst eigene Quiztexte und Quellenverweise.

Die Einzelbelege enthalten pro Karte die Fundstellen, die beiden Prüfzeiten, einen Einzelvermerk und je einen SHA-256-Wert für die Textfassung und den geöffneten Quellenauszug. Die Zeilennummern beziehen sich auf die am Prüfungstag gelesene Web- oder PDF-Ansicht. Andere Darstellungen und spätere Änderungen des Originals können die Nummerierung verschieben. [Reisebelege](einzelbelege-reisen.json) · [Naturbelege](einzelbelege-natur.json)

## Wiederholbarer technischer Listenabgleich

Im Projektverzeichnis prüft `python tools/science03_verify.py` die veröffentlichten Redaktionsunterlagen dieser Lieferung offline. Auf dem ursprünglichen Arbeitsstand vergleicht `python tools/science03_verify.py --working-snapshots .cache/science03` zusätzlich die vollständigen lokalen Belegzeilen mit ihren Fingerabdrücken. Diese internen Auszüge werden beim Spielen nicht benötigt. [Prüfprogramm](../../../../tools/science03_verify.py)
