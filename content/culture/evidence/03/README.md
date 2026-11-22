# Redaktion Geschichte und Unterhaltung zur Ausgabe 0.3

Für den Ausbau am 22. November 2026 lieferte das Ressort 588 neue deutsche Fragen. Die beiden Kategorien enthalten jeweils 176 leichte, 88 mittlere und 30 anspruchsvolle Fragen. Die Schwierigkeit beruht auf einer redaktionellen Einschätzung. Sämtliche menschlichen Beobachtungslisten sind leer.

| Kategorie | Herleiten | Schätzen | Anwenden | Vergleichen | Zeitlich einordnen |
| --- | ---: | ---: | ---: | ---: | ---: |
| Geschichte und Entdeckungen | 152 | 48 | 43 | 21 | 30 |
| Unterhaltung | 118 | 38 | 79 | 41 | 18 |

Der Abschlussabgleich erfasste 349 Quelleneinträge an 270 URLs. Im Welterbekatalog identifiziert die numerische UNESCO-ID den jeweiligen Datensatz innerhalb der XML-Liste. Die [Ergebnisdatei](abnahme.json) nennt Themen, Fassungsprüfsummen, Zählungen und Zeiträume. Die vollständigen Fragen stehen in den 21 Ressortdateien im [Inhaltsverzeichnis](../../).

## Einzelfreigaben

Die Quellenkontrolle las für jeden Sachverhalt eine geöffnete institutionelle Seite, einen Eintrag in einer Originaltabelle oder einen Abschnitt in einem offiziellen Regelwerk. Die Dateien in diesem Verzeichnis mit der Endung `-fakten.json` verbinden jede Frage mit dem Prüfausdruck, der Textposition, dem SHA-256-Wert der geprüften Quelle und der Prüfuhrzeit. Der Fingerabdruck der Frage schließt dabei auch ihren Wortlaut, die vier Antwortmöglichkeiten, den Lösungstext, die Schwierigkeit und die Form ein.

Im zweiten Durchgang las die Codex-Redaktion Frage, Lösung, alle Ablenker und Erklärung erneut zusammen. Bei den Herleitungen wurden die Hinweise und bei den Schätzungen Bezugsgrößen und Größenordnungen verglichen. Überarbeitete Fassungen durchliefen die Quellenkontrolle erneut. Bei der Freigabe wurde die zuletzt gelesene Fassung gegen ihren Fingerabdruck abgeglichen. Der Zeitpunkt unter `editorial.at` bezeichnet den Abschluss dieser Sichtung beim Freigabeexport. Die beiden Einträge nennen den tatsächlich zuständigen Agenten.

Beim Vergleich mit früheren und parallel bearbeiteten Karten ersetzten unter anderem der Getreidetransport auf dem Kaiserkanal, die Zuständigkeit für Gleise und Weichen bei der Bahnreform und die Reaktion der beiden Großmächte in der Suezkrise frühere Entwürfe. Im endgültigen Bestand erläutert die Ballonfrage aus Paris die Kombination aus Wärmequelle und Stoffhülle. Die Schätzung zum Material von Rummikub gibt alle Mengen für eine eigene Überschlagsrechnung. [Fragen zur Entdeckungsgeschichte](../../03-h-entdeckungen.json) · [Fragen zu Gesellschaftsspielen](../../03-e-spieltisch.json)

Die Freigabedateien rotieren die Position der richtigen Antwort. Die redaktionellen Originale halten die Lösung zur Durchsicht an erster Stelle. Der gesonderte Lauf `python -X utf8 tools/culture03_editor.py audit` prüft die veröffentlichten Texte und die zugehörigen Lösungspositionen gegen diese Originale, alle Schema- und Revisionsangaben, die Quellenfingerabdrücke und die geforderten Mengen. [Prüfwerkzeug](../../../../tools/culture03_editor.py) · [Redaktionelle Originale](../../work/03/)

## Quellenangaben und Rechte

Für Geschichte flossen unter anderem die LeMO-Jahreschroniken des Deutschen Historischen Museums und der Stiftung Haus der Geschichte, die EU-Chronik, UNESCO-Kataloge, Bundesarchiv, Bundeszentrale für politische Bildung, Deutsches Patent- und Markenamt, Schloss Versailles, Library of Congress, NASA, CERN, UNICEF, IKRK und die Nobelpreis-Porträts ein. Die Nobelpreis-Porträts dieses Ausbaus sind redaktionelle Webseiten und jeweils einzeln ausgewiesen.

Zu den Unterhaltungsquellen gehören WDR, European Broadcasting Union, DFF – Deutsches Filminstitut & Filmmuseum mit filmportal.de, Pixar, British Film Institute, ACMI, Science and Media Museum, Rock & Roll Hall of Fame, Philharmonia Orchestra, OperaVision, Spiel des Jahres, Deutscher Skatverband, International Football Association Board, World Curling und Lawn Tennis Association. Jedes dieser Häuser ist am konkreten Datensatz mit der verwendeten Adresse genannt.

Die deutsche Redaktion hat Fakten, Titel, Namen, Regeln und selbst berechnete Vergleiche in eigenen Worten verarbeitet. Die Website-Adressen und knappen Suchausdrücke dienen der Nachprüfung. Karten und Spiel enthalten keine Cover, Bilder, Filmausschnitte, Partituren oder Liedtexte dieser Institutionen. Die technischen Abrufkopien liegen im lokalen Recherchecache. Bei den drei EBU-Seiten diente die vom Webwerkzeug ausgegebene Textansicht als lokale Belegfassung. Ihr Hash identifiziert diese Ansicht. Für die Quellen der früheren Ausgaben gelten deren gesonderte [Credit- und Lizenznachweise](../../README.md).
