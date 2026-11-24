# Änderungen

## 0.4.1 · Illustrationen im Quizsalon

Alle sechs Themen haben eigene Panorama-Illustrationen. Die Bilder schließen oben und seitlich mit den Kacheln ab, auch wenn benachbarte Beschreibungen unterschiedlich lang sind. Die zwölf Gäste am Quiztisch haben neue, farbig illustrierte Porträts.

## 0.4.0 · Weiterspielen

- „Noch 5 Fragen“ startet vom Ergebnis oder von „Heute“ eine kostenlose gemischte Runde. Zusatzrunden erweitern das Wissensalbum. Tagesrunde und Wochenziel behalten ihre eigene Wertung.
- Zwölf illustrierte Computergegner wechseln sich am Quiztisch ab. Eine Revanche bringt fünf neue Fragen für dieselbe Besetzung.
- Ein Freundeslink teilt fünf Fragen in gespeicherter Antwortreihenfolge und die erreichte Trefferzahl. Der Empfänger spielt auf seinem eigenen Gerät und kann sein Ergebnis zurückschicken.
- Filmgeschichte, Tierverhalten und Wetter sind als Unterthemen wählbar. Jede angebotene Mischung berücksichtigt freie Karten und deren Schwierigkeit. Die Ausgabe nutzt die 2.400 deutschen Fragen aus 0.3.0. [Inhaltsbericht](CONTENT_REPORT.md) · [Abnahme](UMSETZUNGSPLAN_WEITERSPIELEN.md)

## 0.3.0

- Der deutsche Katalog wächst von 1.200 auf 2.400 Fragen. 1.800 Sachverhalte sind neu, 600 frühere bleiben aktiv und 600 frühere wurden archiviert. Jede Kategorie enthält 400 Fragen. Reines Wiedererkennen sinkt von 1.007 auf 405 Karten und von 83,9 auf 16,9 Prozent. [Vorher-nachher-Vergleich](release/qa/modern-0.3.0/bestand.json)
- Die Tagesrunde enthält eine Schätzfrage und zwei eigens formulierte Hinweisfragen. Auch fällige Wiederholungen berücksichtigen diese Plätze. Höchstens zwei der zehn Aufgaben verlangen reines Wiedererkennen.
- 36 Forschungskarten nennen Publikationsdatum und Originalquelle in der Auflösung. Bereits gespielte Forschungsfragen lassen sich im Wissensalbum gezielt wiederfinden. [Forschungsredaktion](content/research/README.md)
- Der README-Spiel-Link aktualisiert eine zuvor offline gespeicherte Browserausgabe. Eine begonnene Runde behält ihre gespeicherten Fragen und Antworten. [Spiel-Link](https://emfau88.github.io/Quiz/spielen.html?v=0.3.0)

## 0.2.0 · 22. November 2026

- 152 neue deutsche Sachverhalte aus sechs Kategorien. 1.048 frühere Sachverhalte und alle 150 Referenzfragen sind weiter aktiv. Die sechs Kategorien umfassen jeweils 200 Fragen.
- Unterthemen fließen jetzt in die Rundenauswahl ein. Offene Runden behalten ihre gespeicherte Reihenfolge. Redaktionell ausgetauschte Karten bleiben im Verlauf, im Wissensalbum und in der Lernstatistik sichtbar.
- Die eigenständige HTML-Datei und beide lokal installierbaren Android-Ausgaben erhalten dieselbe Katalogversion. [Inhalt](CONTENT_REPORT.md) · [Messung der Auswahl](release/qa/fragenpool/auswahlvergleich.json)

## Lokale Testreihe 0.1.0

- Erstspielbare Tagesrunde mit 24 belegten Fragen. Alle vier Antwortmöglichkeiten, manuelles Weiter und Ergebnis beruhen auf den gespeicherten Antworten. Der erste Android-Build ist als Starter-APK archiviert.
- Referenzausgabe mit 150 Fragen, 25 pro Kategorie. Lokal transaktionale Antworten, unveränderliche Rundensnapshots, Tagesabschlussbuch, getrennte Lernstatistik, Album, Wiedergewusst, Wochenziel und die sechs Kategorieproben.
- Zusätzliche eigenständige HTML-Testausgabe mit freien Themenrunden und Schwierigkeitswahl. Sie verwendet einen eigenen Browser-Spielstand. Die Play-Variante fragt die native Berechtigung ab.
- Geprüftes Browser-Update mit Datenbankmigration, korrigierter Frage und reduziertem Ergebnisnenner. Layoutkorrekturen für lange deutsche Wörter und 200 Prozent Schriftvergrößerung.
- Ausgeglichener 600er-Zwischenstand und Vollkatalog de-7363fcba52a1 mit 1.200 aktiven Sachverhalten. Vier fachliche Doppelungen beim Abgleich der Ressorts ersetzt. Der Vollbestand enthält alle ursprünglichen Referenz-IDs.
- Zwei final signierte **Debug-APKs** für den privaten Test. Die Lokaltestvariante hat eine eigene Kennung und benötigt weder Internet- noch Billing-Berechtigung. Die reguläre Vorschau nutzt die echte Play-Integration und zeigt offen an, wenn das Produkt nicht eingerichtet ist.
- Lokaler Systembackup-/Wiederherstellungstest, Überinstallation über den Referenzstand, sechs Telefonaufnahmen und Store-Vorbereitung mit Icon, Vorstellungsgrafik, Beschreibung und Datenschutzentwurf.
- Vollständige Zehnerrunde mit Google TalkBack, gemessene Android-Prozesskaltstarts und Instrumentierungsprüfungen auf Android 16 mit 16-KB-Speicherseiten.
