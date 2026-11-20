# Änderungen

## Lokale Testreihe 0.1.0

- Erstspielbare Tagesrunde mit 24 belegten Fragen. Alle vier Antwortmöglichkeiten, manuelles Weiter und Ergebnis beruhen auf den gespeicherten Antworten. Der erste Android-Build ist als Starter-APK archiviert.
- Referenzausgabe mit 150 Fragen, 25 pro Kategorie. Lokal transaktionale Antworten, unveränderliche Rundensnapshots, Tagesabschlussbuch, getrennte Lernstatistik, Album, Wiedergewusst, Wochenziel und die sechs Kategorieproben.
- Zusätzliche eigenständige HTML-Testausgabe mit freien Themenrunden und Schwierigkeitswahl. Sie verwendet einen eigenen Browser-Spielstand. Die Play-Variante fragt die native Berechtigung ab.
- Geprüftes Browser-Update mit Datenbankmigration, korrigierter Frage und reduziertem Ergebnisnenner. Layoutkorrekturen für lange deutsche Wörter und 200 Prozent Schriftvergrößerung.
- Ausgeglichener 600er-Zwischenstand und Vollkatalog de-7363fcba52a1 mit 1.200 aktiven Sachverhalten. Vier fachliche Doppelungen beim Abgleich der Ressorts ersetzt. Der Vollbestand enthält alle ursprünglichen Referenz-IDs.
- Zwei final signierte **Debug-APKs** für den privaten Test. Die Lokaltestvariante hat eine eigene Kennung und benötigt weder Internet- noch Billing-Berechtigung. Die reguläre Vorschau nutzt die echte Play-Integration und zeigt offen an, wenn das Produkt nicht eingerichtet ist.
- Lokaler Systembackup-/Wiederherstellungstest, Überinstallation über den Referenzstand, sechs Telefonaufnahmen und Store-Vorbereitung mit Icon, Vorstellungsgrafik, Beschreibung und Datenschutzentwurf.
- Vollständige Zehnerrunde mit Google TalkBack, gemessene Android-Prozesskaltstarts und Instrumentierungsprüfungen auf Android 16 mit 16-KB-Speicherseiten.
