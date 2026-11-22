# Quizsalon · Release-Checkliste

## Lokale Übergabe 0.2.0

- [x] Deutsch, 1.200 aktive Sachverhalte, 152 Einzelaustausche, sechs Kategorien und alle 150 Referenzen nachgewiesen. [Katalogabgleich](release/qa/fragenpool/inhaltsabgleich.json)
- [x] Sollmischung, Themenstreuung und beide Konzentrationsgrenzwerte am neuen Katalog nachgewiesen. [Vergleich](release/qa/fragenpool/auswahlvergleich.json)
- [x] Eigenständige HTML-Datei mit bestehendem Browser-Spielstand offline aktualisiert und bis zum einmalig verbuchten Ergebnis geprüft. [Dateiupdate](release/qa/fragenpool/html-update.json)
- [x] Beide APKs gebaut und installiert. Reguläre und lokale Zugangslogik sowie Signaturen und gebündelte Webdateien geprüft. [APK-Prüfung](release/android/artifacts.json) · [Update](release/qa/fragenpool/android-upgrade/android-ui.json)
- [x] 3.600 Fragenlayouts ohne Textüberlauf. Echte TalkBack-Gesten über zehn Fragen bei 360 dp Breite und 150 Prozent Systemschrift bis zum Ergebnis nachgewiesen. [Korpuslayout](release/qa/korpus-layout.json) · [TalkBack-Protokoll](release/qa/fragenpool/android-talkback/talkback.txt)

Die Beauftragung umfasst die lokale deutsche Fassung. Betreiberangaben, endgültiger Paketname, Signierung für den Store und der Nachweis echter Käufe bleiben Teil einer späteren Entscheidung. [Offene Veröffentlichungsvoraussetzungen](BLOCKERS.md)

## Historische Abnahme der Grundversion

Stand der lokalen Vollversion 0.1.0 mit dem Katalog de-7363fcba52a1. Ein Haken verweist auf den ausgeführten Nachweis. Offene kombinierte Gates nennen ihren bereits nachgewiesenen Teil. Die ursprüngliche, vollständige Prüfvorgabe liegt in docs/ABNAHME_UND_RELEASE.md.


## 1 Technische Funktionsabnahme


### Runde und Persistenz

- [x] Erststart führt ohne Konto und ohne Berechtigungsdialog zur spielbaren Runde. [Spieldurchlauf][P]
- [x] Normalfall: zehn Fragen, vier Antworten, passende Erklärungen, manuelles Weiter. [Spieldurchlauf][P]
- [x] Proberunde: fünf Fragen in einer Kategorie, keine Tages-XP. [Spieldurchlauf][P]
- [x] Falsche Antwort, richtige Antwort und mehrfaches Tippen wurden geprüft. [Spieldurchlauf][P]
- [x] App-Prozess vor Antwort, nach Antwort und auf der Erklärung beendet; Fortsetzung korrekt. [Spieldurchlauf][P]
- [x] Antwortreihenfolge und Fragen bleiben bei Neustart identisch. [Spieldurchlauf][P]
- [x] Antwort, Lernfortschritt und konkreter Wiedergewusst-Hinweis werden gemeinsam und genau einmal gespeichert. [Regelprüfung][R]
- [x] Pausieren erhält die aktive Runde. Bestätigtes Aufgeben beendet sie mit den angezeigten Folgen. [Spieldurchlauf][P] · [Regelprüfung][R]
- [x] Frühere Tagesrunden sind im Verlauf fortsetzbar. Eine Themen- oder Proberunde kann gleichzeitig aktiv sein. [Kalenderprüfung][K] · [Regelprüfung][R]
- [x] Genau eine Tagesrunde pro lokalem day_key. [Regelprüfung][R]
- [x] Start vor Mitternacht, Abschluss danach und parallele heutige Runde korrekt. [Kalenderprüfung][K]
- [x] Zeitzonenwechsel, Sommerzeit und versehentlich vor-/zurückgestellte Uhr blockieren nicht dauerhaft. [Kalenderprüfung][K]
- [x] Kein Duplikat einer Frage oder desselben fact_key innerhalb einer Runde. [Regelprüfung][R]
- [x] Kein versehentliches Abfragen reservierter Fragen aus anderen offenen Sessions. [Regelprüfung][R]
- [x] Erschöpfter Pool, fehlende Fälligkeiten und kleine Kategorie-Teilmengen führen zu erklärten Ersatzfällen. [Regelprüfung][R]
- [x] Bestehender Spielstand überlebt App- und Datenbankupdate. [Android-Überinstallation](release/android/qa-upgrade/android-ui.json) · [Datenbankmigration][U]

### Fortschritt

- [x] Beispiel 7/10 erzeugt genau 90 Tages-XP. [Spieldurchlauf][P]
- [x] Tagesbonus und Antwortauswertung bleiben auch bei wiederholten Events einmalig. [Spieldurchlauf][P]
- [x] Themenrunden beeinflussen Album und Historie, aber weder Tages-XP noch Wochenziel. [Spieldurchlauf][P]
- [x] Pro Kategorie lässt sich die kostenlose Proberunde genau einmal regulär starten und fortsetzen. [Regelprüfung aller sechs Kategorien][R] · [Proberunde im Browser][P]
- [x] Probestatus und Probesession entstehen atomar; die 3/2/0-Mischung und das Aufgeben wurden geprüft. [Regelprüfung][R]
- [x] Die Stufenübergänge 0, 80, 250, 500 und danach je 500 weitere XP funktionieren. [Regelprüfung][R]
- [x] Vier verschiedene abgeschlossene Tagesdaten erfüllen das Wochenziel. [Regelprüfung][R]
- [x] Wiedergewusst erscheint nur unter der festgelegten Fehler- und Abstandsregel. [Regelprüfung][R]
- [x] Sicher gewusst erfordert zwei richtige Antworten im nötigen zeitlichen Abstand. [Regelprüfung][R]
- [x] Fehler nach einer Auszeichnung erzeugen Wiederholungsbedarf, ohne Sammlung zu löschen. [Regelprüfung][R]
- [x] Erstversuchs- und Wiederholungsquoten bleiben getrennt. [Regelprüfung][R]
- [x] Inhaltskorrektur erhöht die richtigen Revisionen; alte Ergebnisse bleiben nachvollziehbar. [Korrekturtest][U]
- [x] Das Wissensalbum zeigt bekannte falsche Erklärungen nicht unmarkiert weiter an. [Korrekturtest][U]
- [x] Zurückgezogene Fragen werden in offenen Runden neutral behandelt; C/N, XP, Mindest-N für Medaillen und ausgeblendeter Vergleich stimmen. [Korrekturtest][U]
- [x] Niemand wird mit erfundenen Bevölkerungs-, IQ- oder Altersgruppenwerten verglichen. [Regelprüfung][R]

### Virtuelle Gegner

- [x] Die Kennzeichnung Computergegner ist verständlich und sichtbar. [Spieldurchlauf][P]
- [x] Gegnerergebnisse werden vor dem Nutzerergebnis gespeichert. [Regelprüfung][R]
- [x] Neustart, Ergebnisaufruf oder schwache Nutzerleistung verändern diese Werte nicht. [Spieldurchlauf][P]
- [x] Gleichstände werden korrekt dargestellt. [Regelprüfung][R]
- [x] Abschalten beeinflusst keine Belohnung. [Spieldurchlauf][P]
- [x] Bei einer zurückgezogenen Frage wird die Vergleichstabelle ausgeblendet. [Regelprüfung][R]

## 2 Contentabnahme

- [x] 1.200 release_approved-Fragen, 200 pro Kategorie. [Inhaltsbericht][I]
- [x] Je Kategorie 120 leicht, 60 mittel, 20 anspruchsvoll. [Inhaltsbericht][I]
- [x] 150 Referenzfragen vorhanden; 25 pro Kategorie. [Inhaltsbericht][I]
- [x] Jede freigegebene Frage besitzt geöffneten Quellenbeleg, Faktenprüfung und unabhängigen redaktionellen Prüfdurchgang. [Inhaltsbericht][I]
- [x] Tatsächliche Prüferart dokumentiert; kein Agent als Mensch ausgegeben. [Inhaltsbericht][I]
- [x] Antwortschlüssel, Eindeutigkeit und vier unterschiedliche Optionen geprüft. [Inhaltsbericht][I]
- [x] Exakte und semantische Dubletten untersucht; Mengenbericht zählt keine bloßen Umformulierungen als unterschiedliche Inhalte. [Inhaltsbericht][I]
- [x] Textlängen einschließlich begründeter Ausnahmen validiert. [Inhaltsbericht][I]
- [x] Keine Entwürfe, ungeklärten Aussagen oder abgelaufenen Fragen im Release. [Inhaltsbericht][I]
- [x] Die Nutzungsrechte der Schriften, Grafiken, Töne und übernommenen Inhalte sind dokumentiert. [Mediennachweise](docs/GESTALTUNG_UND_LIZENZEN.md) · [Fragenlizenzen][I]
- [x] Runtime-Katalog und Inhaltsmanifest reproduzierbar gebaut. [Inhaltsbericht][I]
- [x] Keine offenen kritischen Sachfehler. [Inhaltsbericht][I]
- [ ] Im Zielgruppentest tatsächlich verwendete Fragen und konkrete Rückmeldungen dokumentiert. Beobachtungsbogen vorbereitet, keine tatsächlichen Teilnehmenden.

## 3 Gestaltung und Geräte

- [x] Alle Kernansichten auf kleiner Anzeige bei 360x640 und 360x800 logischen Pixeln geprüft. [Darstellungsprüfung][L]
- [x] Reale Android-Systemschrift bei 100, 150 und maximaler Einstellung geprüft. [Android-Prüfung][A]
- [x] Keine abgeschnittene Frage, Antwort oder Schaltfläche. [Darstellungsprüfung][L]
- [x] Antwortflächen wachsen; Scrollen funktioniert ohne Textverkleinerung. [Darstellungsprüfung][L]
- [x] Textkontrast mindestens 4,5:1; richtige und falsche Zustände sind ohne Farbe verständlich. [Darstellungsprüfung][L]
- [x] Alle zehn Fragen einschließlich Ergebnis wurden auf Android 16 mit aktiviertem Google TalkBack per Wischgeste und Doppeltipp gespielt. [TalkBack-Protokoll](release/android/qa-talkback-gesamtrunde/talkback.txt)
- [ ] Der Fokus nach Antwort und Weiter wurde mit TalkBack verfolgt. Ob Sprachausgabe und Ansagen angenehm verständlich sind und störende Doppelansagen ausbleiben, muss eine Person hören. [TalkBack-Protokoll](release/android/qa-talkback-gesamtrunde/talkback.txt)
- [ ] Ton, Haptik und reduzierte Bewegung funktionieren. Ton- und Haptikschalter sind unabhängig. Der Wahrnehmungstest am Smartphone steht aus.
- [ ] Mindestens ein echtes Android-Smartphone geprüft, zusätzlich Emulatoren für gezielte Plattformfälle. Emulatorprüfungen liegen vor. Ein physisches Testgerät fehlt.
- [ ] App startet und spielt im Flugmodus; Kaufzustand erklärt fehlende Verbindung. Flugmodus bestanden. Der echte Play-Abgleich bei Verbindungsabbruch benötigt den internen Track.
- [x] Beide APKs laufen auf dem Android-16-Systemabbild mit 16-KB-Speicherseiten. Die vom Kernel gemessene Seitengröße beträgt 16.384 Byte. [Gerätelauf][A]
- [x] Systembackup und Wiederherstellung geprüft; Kaufcache und Token werden ausgeschlossen. [Android-Prüfung][A]
- [x] Wiederhergestellte Sessions funktionieren mit neuer Installation-ID. [Android-Prüfung][A]
- [x] Freiwillige Reminder funktionieren bei Ablehnung, Deaktivierung, Neustart und Zeitzonenwechsel. [Android-Prüfung][A]
- [x] Sichtbare Fehlerfälle erlauben Fortsetzung oder einen verständlichen nächsten Schritt. [Android-Prüfung][A]

## 4 Echte Käufe

- [ ] Produkt existiert im richtigen Play-Projekt und ist im Test verfügbar.
- [ ] Erfolgreicher Kauf mit passender Produkt-/Paketidentität geprüft.
- [ ] Kaufdaten und Originalsignatur entsprechend aktueller Dokumentation lokal geprüft. Die Signaturprüfung wurde mit getrennten technischen Prüfdaten getestet.
- [ ] Keine pauschal wahre Verifikation und kein Test-Unlock im Produktionsbuild. Produktionsquellen und gebündelte Module der regulären Vorschau geprüft. Das signierte Betreiber-Release steht aus.
- [ ] Nutzerabbruch erzeugt weder Kauf noch Fehlalarm.
- [ ] Abgelehnte Zahlung schaltet nichts frei.
- [ ] PENDING bleibt ohne Plus; späterer Erfolg beziehungsweise Abbruch wird verarbeitet.
- [ ] App-Ende während des Kaufablaufs wurde geprüft.
- [ ] Mehrfach gelieferte Kaufereignisse bleiben idempotent.
- [ ] Bestätigung erfolgt nach dauerhafter Verarbeitung; wiederholter Fehler wird erneut versucht.
- [x] Das Produkt wird nicht konsumiert. [Android-Prüfung][A]
- [ ] Neuinstallation und Wiederherstellung auf dem passenden Play-Konto funktionieren.
- [ ] Bestätigtes Plus bleibt bei Offline-Neustart nutzbar.
- [ ] Ein Netzwerkfehler wird nicht als Entzug behandelt.
- [ ] Ein erfolgreicher vollständiger Abgleich ohne Berechtigung aktualisiert den Zugang verständlich.
- [ ] Erstattung mit Widerruf getestet; tatsächlicher Entzug beim nächsten erfolgreichen Abgleich erkannt.
- [ ] Bereits gekauftes Plus wird nicht erneut zum Kauf angeboten.
- [ ] Kauf-Token und Schlüssel erscheinen weder im Log noch im Repository noch im Systembackup. Backup-Ausschluss und geschützter Speicher technisch geprüft. Reale Play-Token liegen noch nicht vor.

## 5 Zielgruppentest

Der Beobachtungstest mit ungefähr fünf Personen und die Alltagserprobung mit zwölf bis fünfzehn Personen über sieben bis vierzehn Tage sind **blocked_external**. Es gibt bisher keine gemessenen Rückkehrquoten. [Erprobungsbogen](docs/ERPROBUNG.md)

## 6 Store-Paket

- [x] Store-Titel mit höchstens 30 Zeichen. [Store-Unterlagen][M]
- [x] Kurzbeschreibung mit höchstens 80 Zeichen. [Store-Unterlagen][M]
- [x] Beschreibung mit höchstens 4.000 Zeichen. [Store-Unterlagen][M]
- [x] Store-Icon 512x512 als geeignetes PNG, innerhalb der aktuellen Dateigrößenvorgabe. [Store-Unterlagen][M]
- [x] Feature Graphic 1024x500 ohne Alpha. [Store-Unterlagen][M]
- [x] Sechs echte Bildschirmaufnahmen der Android-Telefonoberfläche mit je 1080×1920 Pixeln. [Originale](release/android/screenshots-final/) · [Store-Exporte](release/store/)
- [x] Mindestens drei Screenshots zeigen tatsächliches Spiel beziehungsweise zentrale Spielfunktionen. [Store-Unterlagen][M]
- [x] Bildschirmtexte auch im Store gut lesbar; keine winzig eingerahmten Geräte. [Store-Unterlagen][M]
- [x] Plus-Leistungsumfang und Einschränkung neuer Fragen korrekt beschrieben. [Store-Unterlagen][M]
- [x] Computergegner sichtbar als virtuell beschrieben. [Store-Unterlagen][M]
- [x] Keine erfundenen Spielerzahlen, Bewertungen oder Gesundheitsversprechen. [Store-Unterlagen][M]
- [ ] Supportadresse, reale Betreiberangaben und öffentlich erreichbare Datenschutzseite. Datenschutzentwurf vorbereitet. Reale öffentliche Angaben fehlen.
- [ ] Datenflussinventar und passende Data-Safety-Angaben. Datenflussinventar vorbereitet. Das Betreiberformular ist offen.
- [ ] Zielgruppenangabe und Inhaltsbewertung passend ausgefüllt; beides nicht verwechseln.
- [ ] Inhaltliche und technische App-Zugangsangaben für Google vollständig.

## 7 Build und Console

- [ ] Paketname endgültig festgelegt und bestehende Projektidentität geprüft.
- [ ] App-Name überprüft; tatsächliche Namens-/Markenkonflikte nicht ignoriert. Der Veranstaltungstitel QuizSalon wird bereits genutzt. Die öffentliche Namensentscheidung steht aus.
- [x] Toolchain und Abhängigkeiten festgehalten. [Android-Prüfung][A]
- [x] Target-API zum Releasezeitpunkt gültig; Recherchewert 20.11.2026 mindestens API 36. [Android-Prüfung][A]
- [x] Tatsächlich eingebundene native Billing-Version gültig; Recherchewert mindestens 8. [Android-Prüfung][A]
- [x] Native Bibliotheken auf 16-KB-Kompatibilität geprüft. [Android-Prüfung][A]
- [ ] Release-AAB korrekt signiert; kein Debug-Zertifikat.
- [ ] Upload-Key und Passwörter außerhalb des Repositories und aus Logs ausgeschlossen. Die lokalen APKs verwenden das Debug-Zertifikat. Einen Betreiber-Upload-Key gibt es noch nicht.
- [ ] versionCode erhöht; versionName und Inhaltsversion nachvollziehbar. Erste private Version 0.1.0, versionCode 1. Keine frühere Console-Version vorhanden.
- [ ] AAB und APK mit SHA256, Commit und Build-Datum dokumentiert. Die APK-Prüfsummen liegen vor. Ein signiertes Release-AAB setzt den Upload-Key voraus.
- [ ] Passenden Test-Track eingerichtet und installierbaren Testlink beziehungsweise APK bereitgestellt. Zwei installierbare lokale End-APKs liegen vor. Ein interner Track fehlt.
- [ ] Pre-launch-Bericht und technische Console-Meldungen geprüft.
- [ ] Einmalkauf im passenden Store-Projekt aktiv und getestet.
- [ ] Aktuelle Kontovoraussetzungen tatsächlich geprüft.
- [ ] Echte Betreiberangaben vollständig; kein Platzhalter in einer öffentlichen Rechtstextseite.

## 8 Freigabe und Abschluss

- [ ] Keine offenen kritischen oder schwerwiegenden Defekte.
- [x] Bekannte Einschränkungen dokumentiert. [Bekannte Grenzen](KNOWN_ISSUES.md)
- [ ] Öffentlicher Veröffentlichungsauftrag liegt vor oder konkrete Freigabeunterlagen sind vollständig vorbereitet. Store-Entwürfe und Medien liegen vor. Die externe Freigabe ist bis nach dem Lokaltest zurückgestellt.
- [ ] Einreichung tatsächlich durchgeführt und dokumentiert.
- [ ] Google-Reviewstatus beobachtet; Einreichung nicht als Freigabe bezeichnet.
- [ ] Öffentlicher Store-Link erreicht den richtigen Eintrag.
- [ ] Ausgelieferte Version installiert und Kernablauf geprüft.
- [ ] Kauf und Wiederherstellung der ausgelieferten Fassung überprüft.
- [x] Support- und Korrekturablauf dokumentiert. [Korrekturablauf][D]

## Nachweisschlüssel

[R]: tests/engine.test.mjs
[P]: release/screenshots/vollbestand/pruefung.json
[K]: release/qa/kalender-browser.json
[U]: release/screenshots/sonderfaelle/pruefung.json
[I]: CONTENT_REPORT.md
[L]: QA_REPORT.md
[A]: android/QA.md
[M]: release/store/STORE_DE.md
[D]: docs/KORREKTUREN.md

Die Web- und Geräteprotokolle, Revisionsangaben, tatsächlichen Dateisummen und technischen Grenzen sind in [QA_REPORT.md](QA_REPORT.md), [BUILDINFO.json](release/BUILDINFO.json) und [KNOWN_ISSUES.md](KNOWN_ISSUES.md) zusammengeführt.
