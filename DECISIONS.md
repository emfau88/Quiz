# Entscheidungen

## Deutscher Fragenpool 0.2.0

- Der aktive Umfang bleibt bei 1.200. Für eine neue Karte wird ihre Austauschpartnerin aus derselben Kategorie festgehalten. Fachlich korrekte alte Karten bleiben in den Redaktionsdaten. Das öffentliche Archiv enthält nur ihre ID und semantische Revision. Für falsche Sachverhalte gilt weiter der datierte Korrekturablauf. [Austauschliste](release/qa/fragenpool/austausch.json) · [Korrekturen](docs/KORREKTUREN.md)
- Hauptunterthema und Frageform stehen in den vorhandenen Tags. Auswahlversion 2 berücksichtigt zunächst Fälligkeit, Schwierigkeitsbedarf und Kategorien. Unter gleich geeigneten Karten bevorzugt sie unvertretene Unterthemen. Eine je Runde deterministische Themenreihenfolge gibt kleinen Bereichen wie Radio dieselbe Chance im Gleichstand. [Auswahlvergleich](release/qa/fragenpool/auswahlvergleich.json)
- Die deutsche Ausgabe 0.2.0 bleibt vollständig lokal spielbar. Die englische Ausgabe ist im Plan als separates späteres Vorhaben geführt.

## Entscheidungen der Grundversion

- Die ausdrückliche Technologiewahl des Auftraggebers hat Vorrang. Quizsalon entsteht als lokale HTML/CSS/JavaScript-App mit einem kleinen nativen Android-Host. Derselbe Spielcode läuft im Browser und im APK.
- Der leere Arbeitsordner wurde als Git-Repository initialisiert. Die fünf ursprünglichen Anhänge bleiben im Übergabeverzeichnis erhalten. Die im Paket genannten JSON-Anhänge lagen nicht bei. Die Zahlen in specs/product_rules.json und das Fragenschema beruhen auf den vorliegenden Textspezifikationen.
- Reine Spielregeln erhalten Katalog und Zeit als Eingaben. Browser speichern den Spielstand in einer serialisierten IndexedDB-Schreibtransaktion, Android in SQLite mit Revisionsvergleich. Die Installationskennung und der native Kaufstatus sind vom sicherbaren Spielstand getrennt.
- Eine erstmalige Nutzung öffnet die erste Frage. Wer pausiert, kann zur Übersicht wechseln und später dieselbe Auswahl fortsetzen. Es gibt sechs kostenlose Kategorieproben. Der Browser bietet den freien Umfang an. Der Verkauf eines dauerhaften Plus-Zugangs gehört ausschließlich zur Google-Play-Ausgabe.
- Der Vorschau-Paketname ist de.quizsalon.vorschau. Der Betreiber legt die endgültige Identität fest. Ein lokaler Play-Abgleich kann Erstattungen und Widerrufe erst nach erfolgreichem Storekontakt erkennen. Ohne Kaufbackend ist die clientseitige Prüfung manipulierbar.
- Es gibt keine automatische Übermittlung von Antworten, Werbung oder KI im Spiel. Browserdaten sind origin- und profilgebunden. Android-Spielstände können nach den Backupregeln des Betriebssystems wiederhergestellt werden.
- Für den ausdrücklich gewünschten vollständigen Lokaltest gibt es eine separate HTML-Ausgabe und eine Android-Variante mit eigener Paketkennung de.quizsalon.lokaltest. Ihr eigenes Zugangsmodul bietet beide Themenmischungen zum Testen an und verarbeitet keine Käufe. Die reguläre App bezieht ihre Berechtigung aus dem nativen Kaufabgleich. Der Nutzer entscheidet nach seinem lokalen Test über weitere Veröffentlichungsschritte.
