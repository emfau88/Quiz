# Deutscher Fragenbestand · 0.2.0

Der Katalog `de-03c46c2cd256` umfasst 1.200 aktive Fragen zu 1.200 Sachverhalten. 1.048 stammen aus der vorherigen Ausgabe, 152 sind neu. Alle 150 Referenzfragen haben ihre ursprüngliche ID und Bedeutung. Je Kategorie gelten weiter 120 leichte, 60 mittlere und 20 anspruchsvolle Fragen. Die Schwierigkeitsstufen sind redaktionelle Einschätzungen. [Manifest](web/data/manifest.json) · [Einzelvergleich mit der ausgelieferten Vorversion](release/qa/fragenpool/inhaltsabgleich.json)

| Kategorie | Neue Sachverhalte | Beispiele |
| --- | ---: | --- |
| Film, Musik und Fernsehen | 48 | Peter Lustigs Bauwagen, die Bundesliga-Konferenz im Radio und die Handlung von *Good Bye, Lenin!* |
| Länder und Reisen | 40 | Spreewaldfließe, Warften auf den Halligen und die Verbindung über den Öresund |
| Alltag und Technik | 20 | Blindbacken, Nabenschaltung und das Funktionsprinzip einer Gartenschere |
| Geschichte und Entdeckungen | 16 | Frauenfußball im DFB, Geisterbahnhöfe im geteilten Berlin und der erste Walkman |
| Sprache und Kultur | 16 | Rochade, Skat, Redewendungen und Osterreiten in der Oberlausitz |
| Natur und Tiere | 12 | Kletterverhalten des Kleibers, Seebrise und Kaltluft im Obstgarten |

Alle aktiven Fragen haben ein Hauptunterthema und eine Frageform. Die Redaktion zählt 1.007 Fragen zum Wiedererkennen, 132 zum Herleiten, 45 zum Vergleichen und 16 zum zeitlichen Einordnen. 134 Fragen tragen das Merkmal „Damals und heute“, 25 ein Ablaufdatum. Die aktiven Einträge verweisen auf 808 unterschiedliche Quellenadressen. Der Regie-Oscar für *Casablanca* steht jetzt auf „anspruchsvoll“. Bei jeder angepassten Einstufung ist der Grund festgehalten. [Themen, Formen und Einstufungen](release/qa/fragenpool/inhaltsabgleich.json) · [152 Austauschpaare](release/qa/fragenpool/austausch.json)

Für die neuen Fragen wurden Originalquellen geöffnet und die fertigen Karten in einem zweiten Durchgang redaktionell geprüft. Die 1.048 übernommenen Karten wurden mit der belegten Vorrevision verglichen. Wortlaut, Antworten, Lösung, Erklärung, Quellen und semantische Revision stimmen überein. Die neue Datenrevision dokumentiert die Einordnung. Die ursprünglichen Quellenabrufe behalten ihr tatsächliches Datum. Die Prüfungen wurden von Agenten durchgeführt. [Unterhaltung](content/culture/evidence/2026-11-unterhaltung-pruefung.json) · [Reisen](content/science/pruefung/2026-11-reisen-belege.json) · [Natur](content/science/pruefung/2026-11-natur-belege.json) · [Alltag](content/science/2026-11-alltag.json) · [Geschichte](content/culture/2026-11-geschichte.json) · [Sprache](content/culture/2026-11-sprache.json)

Der letzte Dublettenabgleich meldete 29 mögliche Überschneidungen. Jede Entscheidung ist mit beiden IDs dokumentiert. Im Entwurf verriet die Radiokarte über Bern den Gegner der deutschen Elf. Diese Angabe wurde entfernt. Die Kanalfrage nennt jetzt Bamberg und Kelheim und lässt das Mündungsmeer der Donau offen. Die Feldhasenkarte behandelt das Hakenschlagen auf der Flucht. [Kandidaten](docs/content-similarities.json) · [Begründete Entscheidungen](release/qa/fragenpool/dublettenentscheidungen.json)

## Reichweite und Abwechslung im Tagesquiz

Jede Rubrik stellt mit 200 Fragen ein Sechstel des aktiven Pools. Bei 1.000 simulierten ersten Tagesrunden kamen alle sechs Rubriken jedes Mal vor. In 982 Runden hatten sogar alle zehn Fragen unterschiedliche Unterthemen. Innerhalb der Rubriken sind einige Themen deutlich dichter besetzt. Zu Sprache und Kultur gehören etwa 52 Literaturfragen und vier über Redensarten. [Rundenauswahl](release/qa/fragenpool/auswahlvergleich.json) · [Kategorien und Unterthemen](release/qa/fragenpool/inhaltsabgleich.json)

Für die Reichweite wurden drei frische Spielstände ab dem 22. November 2026 mit der ausgelieferten Spiellogik fortgeschrieben. Jedes Profil absolvierte täglich eine Tagesrunde, ohne zusätzliche Themenrunden. Die Zahl der richtigen Antworten blieb je Profil konstant, ihre Positionen rotierten täglich. Fällige Wiederholungen zählten bei den verschiedenen Fragen jeweils nur einmal. [Auswahl- und Lernregeln](web/js/engine.js)

| Richtige je Runde | Verschiedene Fragen nach 30 Tagen | Nach 90 Tagen | Alle 1.200 gesehen am |
| ---: | ---: | ---: | ---: |
| 4 | 246 | 726 | 150. Spieltag |
| 7 | 246 | 726 | 150. Spieltag |
| 10 | 254 | 734 | 149. Spieltag |

Die Simulation beschreibt den Vorrat. Zu den Vorlieben tatsächlicher Quizsalon-Spieler liegen bislang keine Beobachtungen vor. Redaktionell bietet die Frageform den größten Spielraum. 83,9 Prozent verlangen Wiedererkennen. Wenn 120 dieser Karten durch Fragen zum Herleiten, Vergleichen oder zeitlichen Einordnen ersetzt werden, steigt der Anteil dieser drei Formen von 16,1 auf 26,1 Prozent. Das ist ein Vorschlag für die nächste Überarbeitung. [Aktueller Katalog und Beobachtungsstand](web/data/manifest.json)

## Archiv · Ausgangsbestand de-7363fcba52a1 vom 20. November 2026

Der lokale Vollbestand enthält **1.200 freigegebene Fragen zu 1.200 unterschiedlichen fact_key-Werten**. Jede Frage hat vier verschiedene Antwortmöglichkeiten, genau einen Lösungsschlüssel, eine Erklärung und einen überprüften Quellenverweis. Die Einzelfreigaben erfolgten durch Agenten in getrennten Sach- und Redaktionsdurchgängen. Für die Zielgruppenerprobung liegen **0 menschliche Beobachtungen** vor.

| Kategorie | Leicht | Mittel | Anspruchsvoll | Gesamt | Davon Referenz |
| --- | ---: | ---: | ---: | ---: | ---: |
| Natur und Tiere | 120 | 60 | 20 | 200 | 25 |
| Länder und Reisen | 120 | 60 | 20 | 200 | 25 |
| Alltag und Technik | 120 | 60 | 20 | 200 | 25 |
| Geschichte und Entdeckungen | 120 | 60 | 20 | 200 | 25 |
| Film, Musik und Fernsehen | 120 | 60 | 20 | 200 | 25 |
| Sprache und Kultur | 120 | 60 | 20 | 200 | 25 |
| **Gesamt** | **720** | **360** | **120** | **1.200** | **150** |

Jede Referenzgruppe enthält 15 leichte, sieben mittlere und drei anspruchsvolle Fragen. Alle ursprünglichen Referenz-IDs sind im Vollbestand enthalten. Die Stufen 24, 150 und 600 wurden tatsächlich gebaut und durchgespielt. Die früheren Nachweise stehen unter release/qa/ und release/screenshots/. Fachliche Nachbesserungen sind im aktuellen Export enthalten.

## Herkunft und Redaktion

Die 1.200 Einzelnachweise verweisen auf **694 unterschiedliche Quellenadressen**. Die Redaktionen haben Fachseiten und strukturierte Originaldaten geöffnet. Bei Tabellen sind auch die benutzten Zeilen oder Felder protokolliert. Die zweite Prüfung betrachtete Frage, Lösung, alle Ablenker, Erklärung, Sprache und Einordnung gemeinsam. Zu den verwendeten Quellen gehören Artenporträts, Institutionen für Maßeinheiten, Museums- und Theaterarchive, Preisverzeichnisse und Literaturausgaben. [Natur, Reisen und Technik](content/science/README.md) · [Geschichte, Unterhaltung und Kultur](content/culture/README.md)

104 Karten tragen das kategorienübergreifende Merkmal „Damals und heute“. 39 Karten haben ein Ablaufdatum. Ihre weitere Verwendung wird bei Katalogbau und Rundenerstellung anhand des Datums geprüft. Die Schwierigkeitsgrade sind redaktionelle Einschätzungen. Trefferquoten und verständliche Formulierungen im tatsächlichen Gebrauch werden bei der späteren Erprobung beobachtet.

Die längste Frage enthält 134 Unicode-Codepoints, die längste Antwort 62 und die längste Erklärung 170. Die 1.200 Fragen wurden mit vier Antwortflächen jeweils bei drei Schriftgrößen im Browser gerendert. Die Prüfungen umfassen damit 3.600 Layouts bei 360 Pixel Breite. [Layoutmessung](release/qa/korpus-layout.json)

## Übergreifender Dublettenabgleich

Beim Gegenlesen der Geschichts- und Reisebestände wurden vier Doppelungen zu Theben, Versailles, Speyer und Lascaux durch andere belegte Sachverhalte ersetzt. Die Referenzfragen blieben erhalten. Bei der Gaudí-Frage wurde der verräterische Ortsbezug entfernt. Sie fragt nach dem Urheber zweier konkreter Bauten. Die zweite Karte fragt nach dem Ort der UNESCO-Werkgruppe.

Die abschließende Wort- und Lösungsprüfung meldete 16 Paare. Die Redaktion hat folgende Entscheidungen festgehalten.

| Paare | Prüfung und Entscheidung |
| ---: | --- |
| 6 | Telefonvorwahl und Internet-Länderkennung sind je Land zwei unterschiedliche Zuordnungen. Die vier Antwortmöglichkeiten gehören jeweils zur konkret gefragten Kennung. |
| 7 | Die Sprachfragen beziehen sich auf unterschiedliche belegte Wortformen und Sprachen. Die gleiche deutsche Bedeutung dient als Lösung. |
| 1 | Tom Hanks erhielt die beiden abgefragten Auszeichnungen für unterschiedliche Filme und in unterschiedlichen Verleihungen. |
| 1 | Brasílias Rolle als Hauptstadt und die Planung einer neuen Stadt im Landesinneren sind unterschiedliche geografische bzw. stadtgeschichtliche Tatsachen. |
| 1 | Die kontinentale Zuordnung Madagaskars und die natürliche Verbreitung der Lemuren betreffen unterschiedliche Gegenstände. |

Alle 16 Paare bleiben aus diesen Gründen im Bestand. Die maschinellen Kandidaten enthalten die beiden konkreten IDs und Fragetexte. [Kandidatenliste](docs/content-similarities.json) · [Kulturredaktion und ersetzte Fassungen](content/culture/evidence/abschlusspruefung.json)

## Reproduzierbarkeit

Die Freigabeprüfung mit JSON Schema Draft 2020-12, aktivierter Formatprüfung, Revisions- und Zeitabgleich sowie globaler Identitäts- und Verteilungsprüfung ist bestanden. Ein zweiter Export in ein anderes Verzeichnis war byteidentisch. Die Laufzeitdatei ist 855.637 Byte groß, ihre SHA-256-Prüfsumme lautet `40d9a873ef0eb6697b0d3c9009a2269a262abd2052762db1956ba56a2398275e`. Der Inhaltshash im Manifest bezieht sich auf die kanonische Folge von Fragen und Rückzügen. Der aktuelle Katalog enthält keine zurückgezogene faktisch falsche Version. Das technische Verhalten für Rückzüge ist mit gesonderten Prüfdaten nachgewiesen. [Manifest](web/data/manifest.json) · [Revisionshistorie](specs/revision-history.json)
