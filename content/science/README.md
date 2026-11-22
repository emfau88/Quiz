# Inhaltsbericht für Natur, Länder und Technik

Im November wurden 40 Reise-, zwölf Natur- und 20 Alltagsfragen ausgetauscht. Der aktive Bestand umfasst 600 deutschsprachige Fragen zu 600 Sachverhalten und verweist auf 375 unterschiedliche Quellen-URLs. Die Reisefragen und die Naturfragen sind im neuen Bericht mit Fundstellen, individuellen Prüfvermerken und Zuschreibung dokumentiert. [Novemberbericht](pruefung/2026-11-INHALTSBERICHT.md) · [Austauschliste Alltag](../rotation/2026-11/alltag.json)

Die folgenden Belege dokumentieren die Ausgangsfassung vom 20. November 2026. Die Datei `01-starter.json` enthält die ersten zwölf Fragen. Die nächsten drei Chargen ergänzen sie zum Referenzbestand. Die Dateien mit den Nummern 03 bis 05 erweitern den ursprünglichen Bestand auf 200 Fragen pro Kategorie.

| Kategorie | Starter | Referenz leicht / mittel / anspruchsvoll | Gesamt leicht / mittel / anspruchsvoll |
| --- | ---: | ---: | ---: |
| Natur und Tiere | 4 | 15 / 7 / 3 | 120 / 60 / 20 |
| Länder und Reisen | 4 | 15 / 7 / 3 | 120 / 60 / 20 |
| Alltag und Technik | 4 | 15 / 7 / 3 | 120 / 60 / 20 |

Alle 600 Datensätze der Ausgangsfassung tragen die redaktionelle Agentenfreigabe. Zu diesen Fragen liegen **0 menschliche Beobachtungen** vor. Verständlichkeit in der Zielgruppe, Trefferquoten und Lesedauer sind offen. Die Schwierigkeit ist bislang eine Einschätzung der Redaktion.

## Nachweise je Frage der Ausgangsfassung

Die Redaktion hat die verlinkten Fachseiten oder den Originaldatensatz geöffnet und Frage, Antwort und Kontext auf Deutsch formuliert. 488 Fragen haben eine Webfundstelle. 112 Länderfragen stützen sich auf die lokal gesicherte Originaltabelle von GeoNames. Insgesamt wurden für die aktiven Fragen 306 unterschiedliche Quellen-URLs verwendet. Der Einzelbeleg im Fragen-JSON enthält URL, Titel, die geprüfte Aussage in eigenen Worten, Abrufzeit und beide Prüfprotokolle. Das Register ordnet alle Quellen ihrem Herausgeber zu. [Quellenregister](pruefung/quellenregister.tsv)

1. Der erste Durchgang glich die vorgesehenen Aussagen einzeln mit dem abgerufenen Text oder den erforderlichen Tabellenfeldern ab. Die nach den Chargen benannten TSV-Dateien im Ordner `pruefung` protokollieren die Fundstellen und Zeiten der ersten Fassung.
2. In einem späteren Durchgang prüfte derselbe Redaktionsagent die vollständige Frage mit ihren vier Antwortmöglichkeiten, die Erklärung, Eindeutigkeit, Themenzuordnung, Schwierigkeit und Lesbarkeit. Dabei wurden beispielsweise ein überlappender Satz von Verwandtschaftsgruppen bei den Hyänen und eine missverständliche Antwort beim Pelikanfuß ersetzt. Die Frage zum Oberen See vergleicht ausdrücklich die genannten Seen. Beim Vierfarbdruck unterscheidet sie die Druckfarben vom RGB-Lichtmodell. Die JSON-Felder `review.fact` und `review.editorial` nennen den Akteur, die tatsächlich geprüfte Revision und getrennte Zeitpunkte.
3. Für die 112 GeoNames-Fragen wurden die Spalten für Hauptstadt, Nachbarn, Währung, Kontinent, Ländervorwahl, Internetendung oder Fläche ausgewertet. Bei Grenzfragen wurde die Nachbarschaft in beiden Länderzeilen geprüft. Flächenvergleiche beziehen alle vier Antwortländer ein. Die Fragen zu Währung, Telefonvorwahl und Internetendung tragen den Bezugsmonat November 2026 und eine Freigabegrenze am 20. November 2028.
4. Die abschließende Nachredaktion ergänzte 100 Länderfragen um konkrete Nachbarländer, eine Vergleichsfläche oder einen Bezug zum Reisen. Die Gaudí-Referenz fragt die Urheberschaft zweier bestimmter Werke. Jede der 101 überarbeiteten Karten wurde erneut gegen die angegebenen Quellen geprüft. Antwort-IDs, Lösung und der für den Lernfortschritt entscheidende Sachverhalt blieben erhalten. [Nachredaktion mit Tabellenwerten und Prüfzeiten](pruefung/reise-revision2.jsonl)
5. Acht weitere bereits angelegte Karten erhielten nach erneutem Quellen- und Textdurchgang den Themenvermerk „Damals und heute“. Eine neunte aktive Themenkarte, zur Entstehung Surtseys, erhielt den Vermerk gleich bei ihrer Anlage. [Themenprüfung](pruefung/thema-revision2.jsonl)
6. Der Vergleich mit den drei anderen Kategorien erkannte die Residenz von Versailles als doppelt abgefragtes Wissen. Die Karte aus dem Ausbau wurde durch eine neu recherchierte Länderfrage zur Vulkaninsel Surtsey ersetzt. Die beiden Nachweise bewahren die Historie außerhalb des aktiven Katalogs. [Ausgesonderter Datensatz](pruefung/ausgesondert-versailles.json) · [Ersatz und Quellenprüfung](pruefung/chargentausch-surtsey.json)

Die Web-Fundstellen beziehen sich auf die zeilennummerierte Textansicht beim Abruf. Sie können sich bei späteren Webseitenänderungen verschieben. Ein SHA-256-Wert je Frage kennzeichnet die tatsächlich herangezogenen, mit Zeilennummer versehenen Textzeilen in UTF-8. Bei mehreren Treffern wurden die Zeilen mit einem LF verbunden. Die URLs und die geprüften Aussagen im Fragebestand ermöglichen die erneute inhaltliche Prüfung. [Web-Fundstellen und Fingerabdrücke](pruefung/web-fundstellen.tsv)

## Quellen und Nutzungsangaben

**GeoNames.** Der Länderexport `countryInfo.txt` wurde am 20. November 2026 um 01:15:17 UTC abgerufen. Die Auswahl im Quiz enthält übersetzte Länder- und Währungsbezeichnungen, eigene Fragen, Erklärungen und gerundete Vergleichswerte. Die Rohdaten stehen unter Creative Commons Attribution 4.0 International. Der SHA-256-Wert der hier verwendeten Originaldatei lautet `79f8f59ea01cbb40438bf1856dd6c2ff201f03f8fc72d0530b2646aaf603ef04`. [Lokale Originaldatei](pruefung/geonames-pays.txt) · [Herausgeber und Zuschreibung](https://www.geonames.org/about.html) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

**UNESCO World Heritage Centre.** 78 Fragen nutzen Angaben einzelner Stättenbeschreibungen. Die UNESCO kennzeichnet diese Beschreibungen mit CC BY-SA 3.0 IGO. Für die deutschen Quizbearbeitungen dieser Stättenbeschreibungen gilt dieselbe Lizenz. Titel und Direktlink der jeweiligen Stätte sind pro Frage und im Quellenregister angegeben. [Quellenregister](pruefung/quellenregister.tsv) · [CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/)

**Weitere Fachquellen.** Die Naturfragen verwenden unter anderem Artenporträts von NABU, Woodland Trust, San Diego Zoo Wildlife Alliance, Smithsonian und Monterey Bay Aquarium sowie Maße und Beobachtungen von NASA und NOAA. Für Technik wurden unter anderem Herstellerdokumentation, Maßeinheiten von BIPM und NIST, die Elementdarstellungen der Royal Society of Chemistry und Verbraucherinformationen ausgewertet. Die Quiztexte sind neu formuliert. Die Quellenliste nennt für jeden Eintrag Herausgeber und URL. Dieser Bestand besteht ausschließlich aus Text und Prüfmetadaten. [Herausgeber und Einzelfundstellen](pruefung/quellenregister.tsv)

## Reproduzierbare Prüfung

Vom Projektstamm aus validiert `python -X utf8 tools/science_verify.py` alle redaktionellen Fragen mit demselben Schema und derselben Zeit- und Revisionsprüfung wie der Katalogcompiler. Der Lauf prüft zusätzlich alle Chargenbelege, Webfundstellen, GeoNames-Zeilenschlüssel, nachrecherchierten Tabellenfelder, die Zuordnung der aktuell freigegebenen Texte zu ihren Nachprüfungen sowie Verteilung, eindeutige IDs und Fragetexte. Der Abschlusslauf bestätigte 600 Fragen, 75 Referenzfragen und 109 aktuell nachgeprüfte zweite Inhaltsrevisionen. Diese Prüfung funktioniert offline. [Prüfprogramm](../../tools/science_verify.py)
