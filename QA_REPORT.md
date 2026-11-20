# Quizsalon · Prüfbericht

Die lokale Testreihe verwendet automatisierte Spielhandlungen und kontrollierte Grenzfälle. Es haben bisher keine menschlichen Testpersonen Ergebnisse beigetragen.

| Bereich | Ausführung und Ergebnis | Nachweis |
| --- | --- | --- |
| Spielregeln | 13 ausführbare Node-Prüfungen für gespeicherte Auswahl, Tagesdatum, Reservierungen, Fälligkeit, Erschöpfung, Stufen, Medaillen, Gleichstände, Lernstatistik, Wiedergewusst, Korrektur und genau einmal gebuchte Belohnung | tests/engine.test.mjs |
| Inhaltswerkzeug | Sechs Testgruppen prüfen URI- und Datumsformate, Antwortschlüssel, Texte, Quellenverweise, Versionswechsel und die Trennung interner Daten vom Runtimeexport. Ein geänderter Lösungsschlüssel benötigt beim Folgebuild eine neue semantische Revision. | tests/catalog_test.py |
| Starter | 24 Fragen. Erster vollständiger Tagesdurchlauf, echter Browserprozessneustart an drei Übergängen, konkurrierende Antwortversuche aus zwei Fenstern, 7/10 und 90 XP, Offline-Neustart | release/screenshots/starter/pruefung.json und zugehörige PNGs |
| Referenzstand | 150 Fragen. Zwölf protokollierte Browsergruppen mit realen Chromium-Prozessneustarts. Fünferprobe mit Fortsetzung, null Tages-XP, gesperrter Browserkauf, zehn Fragen im schwierigen lokalen Themenmodus. Keine unbehandelten JavaScript-Fehler und keine externen HTTP-Anfragen im gemessenen Spielablauf | release/screenshots/referenz/pruefung.json |
| Aktualisierung und Abbruch | Tatsächlich angelegte IndexedDB v1 wieder geöffnet und migriert. Ein erzwungener Transaktionsabbruch ließ Antwort und Lernhistorie gemeinsam unverändert. Simuliertes Katalogupdate neutralisierte auch eine schon beantwortete Position. Alte XP blieben erhalten, aktive Runde endete mit Nenner 9 | tests/storage-browser.mjs und release/screenshots/sonderfaelle/pruefung.json |
| Kalender | Der Browser wechselte während des Spiels zur Berliner Sommerzeit, über die Sonntagsmitternacht und zur Zeitzone New York. Die am Montag nachgeholte Sonntagsrunde zählte zur ursprünglichen Woche. Auch nach einer zehn Jahre vorgestellten und anschließend korrigierten Uhr ließ sich dieselbe Montagsrunde fortsetzen. | [Kalenderprotokoll](release/qa/kalender-browser.json) |
| Darstellung | Browser bei 360×640, 360×800 und 1280×850 CSS-Pixeln. Kleine Anzeige zusätzlich mit 100/150/200 Prozent Webschrift. Erkennbare Umbruchfehler bei langen deutschen Wörtern wurden behoben und nachgeprüft | tests/browser.mjs und PNGs 01–09 der geprüften Bestände |
| Zugänglichkeit | Acht Ansichten in Chromium mit axe-core 4.10.3 auf automatisch prüfbare WCAG-A/AA-Kriterien getestet. Null automatisierte Verstöße in diesem Lauf. Fokus nach Antwort, Weiter und Schließen des Pausendialogs überprüft | release/qa/barrierefreiheit-browser.json |
| Native Erstfassung | Echter APK-Build, Android-14-Emulator, WebView 113. Tagesrunde im Flugmodus, echte Android-Schrift 100/150/200 Prozent, Prozessende und einmalige Belohnung. Separate Instrumentierung für SQLite, Signaturprüfung und geschützten Kaufcache | android/QA.md und release/android/ |

## Vollbestand und Übergabeartefakte

- Der ausgeglichene 600er-Bestand und der endgültige 1.200er-Katalog bestanden die Browser-End-to-End-Prüfung. Die lokale Ein-Datei-Ausgabe wurde per Datei-URL bei abgeschaltetem Netzwerk geöffnet und bis zum Themenrundenergebnis gespielt. [600er-Protokoll](release/screenshots/halbstand/pruefung.json) · [Endprotokoll](release/screenshots/vollbestand/pruefung.json)
- Jede der 1.200 Fragen wurde dreimal bei 360×640 CSS-Pixeln vermessen. Kein getesteter Fragetext und keine Antwort liefen aus der Fläche. Die kleinste gemessene Antwortfläche war 64 CSS-Pixel hoch. Die in acht Ansichten gemessenen Textkontraste erreichten mindestens 5,45:1. [Korpuslayout](release/qa/korpus-layout.json) · [Kontraste und Fokus](release/qa/barrierefreiheit-browser.json)
- Android stellte nach echter Deinstallation und Neuinstallation den Spielstand per lokalem BackupManager-Systemtransport byteidentisch wieder her. Die App erzeugte eine neue Installationskennung. Ein Kontrollmarker im vom Backup ausgeschlossenen Bereich fehlte wie vorgesehen. [System-Restore](release/android/qa-plattform/android-backup.json)
- Die Android-Überinstallation über die Referenzfassung bewahrte eine bereits beantwortete offene Proberunde, deren Erklärung, Fortschritt, XP-Journal und Installationskennung. Das vollständige APK setzte an Frage zwei fort. [Android-Update](release/android/qa-upgrade/android-ui.json)
- Der endgültige reguläre Android-Build spielte die Tagesrunde im Flugmodus. Sieben richtige Antworten ergaben eine Silbermedaille und 90 XP. Sechs Screenshots wurden aus der laufenden App erfasst. Die für den Store exportierten RGB-PNGs stimmen in allen Farbwerten mit den Originalaufnahmen überein. [Android-Endprotokoll](release/android/screenshots-final/android-ui.json) · [Store-Medien](release/store)
- Beide Endfassungen liefen unter Android 16 auf einem Emulator mit gemessenen 16.384 Byte pro Speicherseite. Alle 19 Instrumentierungsfälle bestanden auch auf diesem Systemabbild. [Android-Gerätebericht](android/QA.md)

## Offene externe Abnahme

Die Erprobung auf einem physischen Smartphone und der TalkBack-Hörtest durch eine Person stehen aus. Für die Beobachtungsstudie liegen keine Teilnehmerdaten vor. Der Bogen in docs/ERPROBUNG.md trennt angebotene Fragen von tatsächlich gesehenen Fragen.

Eine echte Zahlung, ausstehende und abgelehnte Testzahlung, Abbruch, erneute Zustellung, Wiederherstellung nach Neuinstallation, Offline-Start mit echtem Beleg sowie Kaufentzug müssen später über den zugehörigen Play-Track geprüft werden. Die getrennten technischen Signatur- und Zustandsprüfungen erfassen simulierte Eingaben. Das Produkt und die Testkonten stehen noch aus.
