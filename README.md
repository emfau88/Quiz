# Quizsalon

**[▶ Quizsalon 0.4.1 auf dem Handy oder im Browser spielen](https://emfau88.github.io/Quiz/spielen.html?v=0.4.1)**

Du startest mit der ersten von zehn Tagesfragen. Danach kannst du mit **„Noch 5 Fragen“** beliebig oft kostenlos weiterspielen. Am Quiztisch sitzen drei von zwölf illustrierten Computergegnern. Für eine Revanche kannst du dieselben drei Gäste wieder einladen. Oder du schickst einem Freund deinen Spiel-Link. Er bekommt dieselben fünf Fragen und kann dir sein Ergebnis zurückschicken. Dein Fortschritt bleibt in diesem Browser. Nach dem ersten vollständigen Laden kannst du offline weiterspielen.

Ein deutschsprachiges, lokal spielbares Tagesquiz für Browser und Android. Oberfläche und Spielregeln sind in HTML, CSS und JavaScript umgesetzt. Der Android-Host verwendet Java und die System-WebView.

Die deutsche Ausgabe **0.4.1** enthält 2.400 Fragen. In jeder neuen Tagesrunde schätzt du einmal eine Größenordnung und löst zwei eigens formulierte Hinweisfragen. Höchstens zwei der zehn Fragen verlangen reines Wiedererkennen. Dienstags, donnerstags und sonntags stammt eine Frage aus der Forschung, solange für den Spieltag eine Veröffentlichung der letzten drei Jahre vorliegt. Die Auflösung zeigt das Erscheinungsdatum und verlinkt die Quelle. Angefangene Runden lassen sich auch nach einem Update in ihrer ursprünglichen Reihenfolge beenden. [Inhaltsbericht und Vergleich zur Vorversion](CONTENT_REPORT.md) · [Auswahl für die zwei Hinweisfragen](specs/daily_clues.json)

## Ausgaben zum Herunterladen

Die sechs Themen haben eigene Panorama-Illustrationen. Am Quiztisch erscheinen zwölf individuell gezeichnete Gäste. [Themen direkt öffnen](https://emfau88.github.io/Quiz/spielen.html?v=0.4.1#themen) · [Alle zwölf Porträts ansehen](release/qa/0.4.1/gaeste.webp)

- Öffne die HTML-Datei per Doppelklick in Chrome oder Edge. Sie enthält Fragen, Bilder und Schriften. [Lokale HTML-Version](release/Quizsalon-Lokaltest.html)
- Die Android-Testausgabe bietet alle Themen und beide Schwierigkeitsstufen. [APK für den lokalen Test](release/android/Quizsalon-Lokaltest.apk)
- Die Android-Vorschau enthält die reguläre Zugangslogik. Das zugehörige Play-Projekt und der echte Testkauf stehen noch aus. [APK mit Play-Anbindung](release/android/Quizsalon-Play-Vorschau.apk)

Für deinen lokalen Test sind keine Zugangsdaten erforderlich. Die Testausgabe gewährt keine Play-Berechtigung. Die Spielstände der Ausgaben sind getrennt. Details stehen in [Lokal testen](release/LOKAL_TESTEN.md).

Das ZIP-Übergabepaket enthält den vollständigen Quellenstand einschließlich Fragenredaktion, Prüfnachweisen und Store-Medien. Nach dem Entpacken liegen die spielbaren Dateien im Ordner **release**.

## Spielen

Beim ersten Start öffnet sich Frage eins. Eine Tagesrunde hat zehn Fragen und bis zu zwei gezielt fällige Wiederholungen. Nach jeder Antwort bleibt die Erklärung sichtbar, bis du weitergehst. **Pausieren** bewahrt die Auswahl. Unter **Mein Wissen → Verlauf** kannst du auch eine offene Runde von einem früheren Tag beenden.

Eine abgeschlossene Tagesrunde mit gültigen Fragen bringt 20 XP sowie 10 XP je richtige Antwort. Vier abgeschlossene Tagesdaten in einer Kalenderwoche erfüllen das Wochenziel. In Zusatzrunden wachsen Lernhistorie und Album. Über **Thema wählen** findest du sechs Hauptrubriken sowie Filmgeschichte, Tierverhalten und Wetter. Im regulären Spiel gibt es je Hauptrubrik eine kostenlose Kennenlernrunde. Der Einmalkauf Plus öffnet die freie Themenwahl. In der Browser-Testausgabe kannst du diese Themen direkt ausprobieren.

Für einen Freundesvergleich spielst du zuerst eine gemischte Fünferrunde oder Revanche zu Ende. Wähle **Freunde herausfordern** und teile den Link über das Systemmenü oder kopiere ihn. Der Empfänger spielt im Browser, kann die geladene Runde offline beenden und dir anschließend beide Trefferzahlen als Text zurücksenden. Tisch und Revanche kannst du in den Einstellungen ausblenden. [Quiztisch](release/qa/weiterspielen-0.4.0/ui/01-Quiztisch.png) · [Freundesvergleich](release/qa/weiterspielen-0.4.0/ui/09-Freundesergebnis.png)

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

Die Auswertung des aktuellen Katalogs und der Tagesrunden lässt sich mit drei Befehlen wiederholen. Der Bestandsvergleich nutzt die Git-Historie der vorherigen Ausgabe.

```powershell
python tools/audit-modern.py
python tools/review-modern.py
node tools/modern-rounds.mjs
```

Für die Entwicklung startet `npm.cmd start` einen rein lokalen statischen Server unter `http://127.0.0.1:5184`. Unter `/lokaltest.html` liefert er die gebaute lokale Testdatei. Die Mehrdateienfassung unter `/` verwendet die reguläre Themenzugangslogik.

```powershell
.\android\gradlew.bat -p android :app:assembleLocalTest :app:assembleDebug
```

Die Android-Anleitung nennt die getrennten Buildziele und die echten Eingaben eines künftigen Store-Releases. [Android-Build](android/README.md)

Die kostenlose Kurzrunde und die Eigenständigkeit der Einzeldatei lassen sich mit `node tests/quick-browser.mjs` und `node tests/standalone-invite.mjs` prüfen. Für den Zwei-Profile-Test baut der erste Befehl eine Pages-Ausgabe in einem neuen Verzeichnis. Der zweite spielt einen Freundeslink auf beiden Seiten bis zum Ergebnis durch.

```powershell
node tools/package-web.mjs --pages .cache/probelauf/Quiz
node tests/followup-browser.mjs --pages .cache/probelauf/Quiz
```

## Übergabestand

GitHub Actions prüft bei jedem Push auf `main` die Spielregeln, den Fragenkatalog und die Browser-Testausgabe mit zwei mobilen Browserprofilen. Nach bestandenen Prüfungen aktualisiert der Workflow den Spiel-Link. [Pages-Workflow](.github/workflows/pages.yml)

Die Android-Veröffentlichung bei Google Play ist zurückgestellt. Die Roadmap und die Abnahmeliste führen die lokalen Nachweise und die offenen Geräte-, Zielgruppen- und Kaufprüfungen. [Roadmap](ROADMAP.md) · [Prüfbericht](QA_REPORT.md) · [Release-Checkliste](RELEASE_CHECKLIST.md) · [Externe Abhängigkeiten](BLOCKERS.md)
