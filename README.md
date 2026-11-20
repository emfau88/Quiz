# Quizsalon

Ein deutschsprachiges, lokal spielbares Tagesquiz für Browser und Android. Oberfläche und Spielregeln sind in HTML, CSS und JavaScript umgesetzt. Der Android-Host verwendet Java und die System-WebView.

## Direkt ausprobieren

- Öffne die HTML-Datei per Doppelklick in Chrome oder Edge. Sie enthält Fragen, Bilder und Schriften. [Lokale HTML-Version](release/Quizsalon-Lokaltest.html)
- Die Android-Testausgabe bietet alle Themen und beide Schwierigkeitsstufen. [APK für den lokalen Test](release/android/Quizsalon-Lokaltest.apk)
- Die Android-Vorschau enthält die reguläre Zugangslogik. Das zugehörige Play-Projekt und der echte Testkauf stehen noch aus. [APK mit Play-Anbindung](release/android/Quizsalon-Play-Vorschau.apk)

Für deinen lokalen Test sind keine Zugangsdaten erforderlich. Die Testausgabe gewährt keine Play-Berechtigung. Die Spielstände der Ausgaben sind getrennt. Details stehen in [Lokal testen](release/LOKAL_TESTEN.md).

Das ZIP-Übergabepaket enthält den vollständigen Quellenstand einschließlich Fragenredaktion, Prüfnachweisen und Store-Medien. Nach dem Entpacken liegen die spielbaren Dateien im Ordner **release**.

## Spielen

Beim ersten Start öffnet sich Frage eins. Eine Tagesrunde hat zehn Fragen und bis zu zwei gezielt fällige Wiederholungen. Nach jeder Antwort bleibt die Erklärung sichtbar, bis du weitergehst. **Pausieren** bewahrt die Auswahl. Unter **Mein Wissen → Verlauf** kannst du auch eine offene Runde von einem früheren Tag beenden.

Eine abgeschlossene Tagesrunde mit gültigen Fragen bringt 20 XP sowie 10 XP je richtige Antwort. Vier abgeschlossene Tagesdaten in einer Kalenderwoche erfüllen das Wochenziel. Kennenlern- und Themenrunden verändern Lernhistorie und Album. Die Regelerklärungen findest du auch unter **Mein Wissen → Statistik**.

## Quellen und Aufbau

| Verzeichnis | Inhalt |
| --- | --- |
| web/ | Installierbare Weboberfläche, lokale Schriften und Spielgrafik, Offline-Cache und Laufzeitkatalog |
| web/js/engine.js | Reine Auswahl-, Lern-, Abschluss- und Korrekturregeln |
| web/js/storage.js | IndexedDB-Transaktionen und native SQLite-Anbindung |
| android/ | Nativer Host, Kaufabgleich, Reminder, Backupregeln, Gradle-Wrapper und Instrumentierung |
| content/ | Redaktionelle Datensätze, tatsächliche Quellenprüfungen und getrennte Redaktionsnachweise |
| specs/ | Produktregeln, JSON-Schema und belegter Revisionsstand |
| tests/, tools/ | Regressionstests, Inhaltsprüfung, Offline-Paketierung und Artefaktprüfung |
| release/ | Auslieferbare lokale Dateien, reale Screenshots, QA-Protokolle und Store-Vorbereitung |

Der Compiler erzeugt den Laufzeitbestand aus freigegebenen Datensätzen. Interne Prüfprotokolle und Beobachtungsfelder bleiben in der Redaktion. [Inhaltsbericht](CONTENT_REPORT.md) · [Redaktionsvorgaben](docs/CONTENT_SPEC.md) · [Korrekturablauf](docs/KORREKTUREN.md)

## Reproduzieren

Verwendet wurden Node 22.17.1, Python 3.13, JDK 17 und Android-SDK 36. Die JavaScript-Werkzeuge sind im npm-Lockfile fixiert. Der Webclient selbst braucht während des Spielens keine Paketinstallation.

```powershell
npm.cmd ci
python -m pip install -r requirements.txt
python tools/catalog.py --stage release
node tools/package-web.mjs
npm.cmd test
python tests/catalog_test.py
```

Der Browserprüfer nutzt das zu playwright-core 1.61.1 passende Chromium. Ein fehlendes Testsystem lässt sich mit dem folgenden Kommando installieren. Die übrigen Kommandos führen die tatsächlichen Browserprüfungen aus.

```powershell
npx.cmd playwright-core install chromium
node tests/browser.mjs vollbestand
node tests/storage-browser.mjs
node tests/calendar-browser.mjs
node tests/corpus-layout.mjs
node tests/accessibility.mjs
```

Für die Entwicklung startet `npm.cmd start` einen rein lokalen statischen Server unter `http://127.0.0.1:5184`. Unter `/lokaltest.html` liefert er die gebaute lokale Testdatei. Die Mehrdateienfassung unter `/` verwendet die reguläre Themenzugangslogik.

```powershell
.\android\gradlew.bat -p android :app:assembleLocalTest :app:assembleDebug
```

Die Android-Anleitung nennt die getrennten Buildziele und die echten Eingaben eines künftigen Store-Releases. [Android-Build](android/README.md)

## Übergabestand

Die Roadmap und die umfassende Abnahmeliste unterscheiden lokal nachgewiesene Funktionen, ausstehende Geräte- und Zielgruppentests und den späteren Play-Prozess. Die öffentliche Veröffentlichung wurde zurückgestellt. [Roadmap](ROADMAP.md) · [Prüfbericht](QA_REPORT.md) · [Release-Checkliste](RELEASE_CHECKLIST.md) · [Externe Abhängigkeiten](BLOCKERS.md)
