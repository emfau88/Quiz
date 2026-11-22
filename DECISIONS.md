# Entscheidungen

## Tagesrunde und Redaktion in 0.3.0

- Eine neue Tagesrunde hat zehn Plätze. Genau einer ist für eine Schätzung und zwei sind für redaktionell geprüfte Hinweisfragen vorgesehen. Höchstens zwei Plätze können reines Wiedererkennen verlangen. Die Formbegrenzungen gelten ebenfalls bei fälligen Lernwiederholungen. [Produktregeln](specs/product_rules.json) · [Grenzfälle der Auswahl](tests/daily-formats.test.mjs)
- Für die beiden Hinweisplätze gibt es eine bevorzugte Titelauswahl. Ein guter Hinweis liefert eine Beobachtung, einen Widerspruch oder mehrere Bedingungen, mit denen man Möglichkeiten ausschließen kann. Eine frische Runde erhält zwei Titel dieser Auswahl. Beim längeren Spielen können fällige oder weitere ungesehene Herleitungen einen der Plätze einnehmen. Mindestens ein bevorzugter Titel bleibt dabei vorgesehen, solange einer zur Verfügung steht. [Tagesauswahl nach Kategorie](specs/daily_clues.json)
- Forschung erhält Publikationsdatum, Herausgeber und einen direkt verknüpften Originalbeleg. Die Frage und ihre Erklärung liegen lokal vor. Die Daten bleiben auch bei Spielunterbrechung Teil der gespeicherten Runde. [Forschungsredaktion](content/research/README.md)
- Bei einer neuen Aufgabenstellung zum selben Sachverhalt wird die Inhaltsrevision erhöht. Der Lösungsschlüssel und die semantische Revision bleiben für diese Karten erhalten. Die 132 bisherigen Herleitungen wurden einzeln neu eingeordnet. [Einzelentscheidungen](release/qa/modern-0.3.0/alte-herleitungen.json) · [60 überarbeitete Wissensabfragen](release/qa/modern-0.3.0/ueberarbeitete-wissensabfragen.json)

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
