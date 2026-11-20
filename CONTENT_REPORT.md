# Fragenbestand · de-7363fcba52a1

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
