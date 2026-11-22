# Android-Prüfbericht

## Aktuelle deutsche Ausgabe 0.2.0

Lokale APK und reguläre Vorschau tragen Version 0.2.0, versionCode 2 und den Katalog `de-03c46c2cd256`. Die Prüfung hat jede gebündelte Webdatei jeweils byteweise mit der vorgesehenen Quelle verglichen, beide APK-Signaturen und 16-KB-Ausrichtung geprüft sowie die getrennten Berechtigungen der beiden Ausgaben bestätigt. Die lokale APK enthält weder Internet- noch Billing-Berechtigung. [Artefaktprüfung und Prüfsummen](../release/android/artifacts.json)

Auf dem eigens angelegten Android-16-Emulator mit 16-KB-Speicherseiten wurde die Vorschau über die installierte Version 0.1.0 aktualisiert. Gespeicherte Frage, Antwort, Fortschritt, Buchungen und Installationskennung stimmten vor und nach dem Update überein. Nach der gespeicherten Erklärung ging dieselbe Runde mit Frage zwei weiter. Auch die separat installierte lokale Ausgabe schloss eine anspruchsvolle Themenrunde im Flugmodus ab. [Updateprotokoll](../release/qa/fragenpool/android-upgrade/android-ui.json) · [Lokale Themenrunde](../release/qa/fragenpool/android-lokal/android-ui.json) · [Bildschirmaufnahme](../release/qa/fragenpool/android-lokal/lokaltest-themenrunde.png)

Der eigenständige TalkBack-Lauf verwendete die installierte Android Accessibility Suite, einen 360 dp breiten Bildschirm und 150 Prozent Systemschrift. Alle zehn Antwortwerte wurden nach Wischgeste und Doppeltipp im SQLite-Spielstand bestätigt. Bei allen zehn Schritten erreichte der Fokus die Weiteraktion. Das Ergebnis enthielt vier richtige Antworten, 60 XP und genau eine Buchung. [Gerätewerte](../release/qa/fragenpool/android-talkback/geraet.txt) · [Fokus- und Gestenprotokoll](../release/qa/fragenpool/android-talkback/talkback.txt) · [Bildschirmaufnahme des Ergebnisses](../release/qa/fragenpool/android-talkback/03-rundenergebnis.png)

Alle 19 nativen Instrumentierungsfälle bestanden auch mit dem Build 0.2.0. Darunter sind parallele SQLite-Schreibvorgänge, erneutes Öffnen, Migration, Kalendergrenzen und die lokale Verarbeitung signierter Prüfdaten. [Natives Ausführungsprotokoll](../release/qa/fragenpool/android-instrumentierung.txt)

## Historische Android-Abnahme der Ausgabe 0.1.0


Stand 20. November 2026. Die folgenden Läufe wurden auf eigens angelegten Android-Emulatoren ausgeführt. Die APKs für die lokale Erprobung tragen ein Debug-Zertifikat. Das öffentliche Release braucht Betreiberangaben, die Play-App, die Upload-Signierung und externe Abnahmen.

## Endstand

Die beiden installierbaren Ausgaben enthalten den Katalog `de-7363fcba52a1` mit 1.200 Fragen. Alle 22 gebündelten Assets wurden byteweise mit den Quellen verglichen. Beide APKs sind mit APK Signature Scheme v2 signiert und bestehen `zipalign -c -P 16 4`. Es sind keine nativen `.so`-Bibliotheken enthalten. Zwischen regulärer und lokaler Themenfreigabe weicht nur das vorgesehene JavaScript-Zugangsmodul ab. Der lokale Build enthält weder Play-Billing- noch Internetberechtigung. [Prüfsummen, Dateigrößen und Berechtigungen](../release/android/artifacts.json)

* **Reguläre Play-Vorschau**. Nach Installation des End-APKs über die 150er-Referenzfassung mittels `adb install -r` stimmten die SHA-256-Abdrücke der laufenden Kennenlernrunde, des Lernfortschritts, der Belohnungsbuchungen und der Installationskennung überein. Die gespeicherte Erklärung war sichtbar. Durch Antippen ging dieselbe Runde mit Frage zwei weiter. [Nachweis des Updates](../release/android/qa-upgrade/android-ui.json)
* **Finale Tagesrunde**. Zehn Fragen beim Offline-Erststart mit Prozessabbrüchen, Ergebnis mit 90 XP, optionalem Vergleich und einem Ledger-Eintrag. Sechs unverzerrte Android-Screenshots mit 1080 × 1920 Pixeln zeigen Frage, Erklärung, Ergebnis, Heute, Themen und Wissensalbum. [Durchlauf und Originalbilder](../release/android/screenshots-final/)
* **Finaler Lokaltest**. Im installierten APK ohne Netzwerkrecht ließ sich die anspruchsvolle Themenrunde über zehn Fragen abschließen. Die örtliche Erprobung erteilte keine Play-Kaufberechtigung. [Durchlauf und Originalbilder](../release/android/screenshots-final-lokal/)
* **Echte Erinnerungszustellung**. Die Android-Erinnerung wurde für die lokale Uhrzeit 02:07 eingerichtet. Bei im Hintergrund liegender App erschien die Systembenachrichtigung. Anschließendes Ausschalten entfernte sie aus der Benachrichtigungsliste. [Geräteprotokoll](../release/android/qa-benachrichtigung/android-ui.json)

## Android 16 mit 16-KB-Speicherseiten

Beide finalen APKs wurden auf dem offiziellen Android-16-Systemabbild `google_apis_ps16k` für x86_64 installiert. `getconf PAGESIZE` ergab **16384 Byte** auf `sdk_gphone16k_x86_64`, API 36. Alle 19 Instrumentierungsfälle liefen mit Erfolg, einschließlich SQLite, Unicode, Wiederöffnung, Migration, Android Keystore und Rücknahme der lokal gespeicherten Kaufberechtigung. WebView-Version 133.0.6943.137. [Instrumentierungsprotokoll API 36](../release/android/qa-plattform/instrumentierung-api36-16k.txt) · [Android-Dokumentation zu 16 KB](https://developer.android.com/guide/practices/page-sizes)

Auf diesem Abbild ist Google TalkBack 16.0.0.738667889 vorinstalliert. Bei 4 GB emuliertem Arbeitsspeicher und vier CPU-Kernen war der Dienst mit aktiver Berührungserkundung gebunden. Die Prüfung verwendet Touchereignisse auf dem virtuellen Hardware-Touchscreen des Emulators. Android selbst interpretiert die Wisch- und Doppeltippgesten. Der Instrumentierungstest liest den tatsächlichen TalkBack-Fokus und die nach dem Doppeltipp in SQLite verbuchte Antwort aus. Zwei Original-Screenshots und das Protokoll belegen die Fokusreihenfolge der ersten Frage. [Gestenprotokoll und Originalbilder](../release/android/qa-talkback/) · [TalkBack-Touchgesten](https://support.google.com/accessibility/android/answer/6151827?hl=de)

**Vollständiger TalkBack-Durchlauf**. Bei jeder der zehn Fragen wanderte der Fokus durch eine echte Wischgeste auf eine benachbarte Antwort. Der folgende Doppeltipp verbuchte genau diese Antwort. Auch „Nächste Frage“ und schließlich „Ergebnis ansehen“ wurden per TalkBack fokussiert und doppelt angetippt. Das sichtbare Ergebnis zeigte bei zwei richtigen Antworten 40 XP. Die SQLite-Prüfung fand zehn gültige Antworten und genau eine entsprechend hohe Abschlussbuchung. Auf den Originalbildern sind die grünen TalkBack-Fokusrahmen auf beiden Antwortmöglichkeiten und am Ende auf „Dein Rundenergebnis“ sichtbar. [Protokoll des vollständigen Durchlaufs und Screenshots](../release/android/qa-talkback-gesamtrunde/) · [Tatsächliche Gerätekonfiguration](../release/android/qa-16k/geraet.json)

**Normaler Prozesskaltstart**. Drei Läufe der fertigen, debuggable Play-Vorschau mit bestehender lokaler Runde ergaben **1.595 ms, 1.243 ms und 2.592 ms**. Der Median betrug 1.595 ms. Eine Messung überschritt das Richtziel von ungefähr zwei Sekunden. Nach `am force-stop` lief die Messung auf der monotonen Hostuhr vom ADB-Startaufruf bis zur ersten per Hit-Test erreichbaren von vier aktivierten Antworten. Anschließend bestätigte ein echter Android-Tap jeweils die Bedienbarkeit. Das Messintervall betrug bis zu 250 ms. ADB- und Verbindungsaufwand sind enthalten. Die Vergleichsmessung mit einem signierten Release- oder Profilbuild auf einem benannten physischen Mittelklassegerät steht aus. [Einzelmessungen und Methode](../release/android/qa-kaltstart/android-ui.json)

Im ersten Versuch mit 2 GB meldete das frisch gestartete Android-System einen blockierten System-UI-Dienst und beendete TalkBack wegen Speichermangels. Der Instrumentierungsbericht für SQLite und Kaufzustände war bereits erfolgreich. Die UI-, TalkBack- und Zeitmessungen oben stammen vom eingerichteten Gerät mit 4 GB. [Erster UI-Prüfversuch bei 2 GB](../release/android/qa-16k/erste-ui-pruefung-2gb.json)

## Nachweise auf Android 14

Android 14, API 34, x86_64, Gerätemodell `sdk_gphone64_x86_64`, System-WebView 113.0.5672.136. `getconf PAGESIZE` ergab 4096 Byte. Die schmale Konfiguration hat 1080 × 1920 physische Pixel bei 480 dpi und eine Breite von 360 CSS-Pixeln. Die Prüfung mit 150 % Systemschrift nutzte 1080 × 2400, die Prüfung mit 200 % Systemschrift 1080 × 1920.

| Gegenstand | Beobachtung | Beleg |
| --- | --- | --- |
| Erststart und Tagesrunde | Offline im Flugmodus erschienen vier Antworten. Zehn Fragen wurden durchgespielt. Sieben richtige Antworten ergaben 90 XP. Der optionale Vergleich enthielt drei ausdrücklich bezeichnete Computergegner. | [Starterdurchlauf](../release/android/screenshots-starter/android-ui.json) |
| Prozessende | Erzwungenes Prozessende vor der ersten Antwort, nach der ersten Antwort und vor dem Ergebnis. Die App erhielt Fragen, Reihenfolge, Antwort und Erklärung. Android-Zurück öffnete den Pausendialog. | [Starterdurchlauf](../release/android/screenshots-starter/android-ui.json) |
| Belohnung | Nach erneutem Öffnen des Ergebnisses, Prozessneustarts und Änderungen der Schriftgröße bestand genau eine Belohnungsbuchung. | [Starterdurchlauf](../release/android/screenshots-starter/android-ui.json) |
| Systemschrift und Zugänglichkeit | Auf 360 CSS-Pixeln und bei 100 %, 150 % und 200 % Android-Systemschrift trat im gemessenen Inhalt kein horizontales Überlaufen auf. Die gerenderte Frage und mindestens vier Schaltflächen waren im Accessibility-Baum der laufenden WebView sichtbar. | [Messungen und Android-Screenshots](../release/android/screenshots-starter/) |
| Lokale freie Themenrunde | Im getrennten Lokaltest mit 150 Fragen wurde eine anspruchsvolle Länder-und-Reisen-Runde mit zehn Fragen abgeschlossen. Die täglichen Erfahrungspunkte blieben unverändert. Der native Kaufstatus lautete vor und nach dem Spiel `unavailable`. | [Referenzlauf](../release/android/screenshots-referenz/android-ui.json) |
| Erinnerungen | Tatsächlichen Android-Berechtigungsdialog einmal abgelehnt und anschließend auf erneute Anforderung erlaubt. Der lokale Alarm erschien im Android-Alarmmanager. Ein Zeitzonenwechsel und App-Neustart erhielten die lokale Uhrzeit. Ausschalten entfernte die eingestellte Zeit. | [Geräteprotokoll](../release/android/qa-plattform/android-ui.json) |
| Android BackupManager | Der lokale Systemtransport sicherte die laufende Spielstanddatenbank. Nach Deinstallation, Neuinstallation und System-Restore war deren SHA-256 unverändert. Kennung und Kontrollmarker in `no_backup` fehlten. Der App-Start erzeugte eine neue Kennung. | [Sicherungsprüfung](../release/android/qa-plattform/android-backup.json) |
| SQLite und Kaufzustandslogik | Das getrennte Instrumentierungs-APK prüft auf Android Revisionenkonflikte, Migration, Wiederöffnung und einen mehr als zwei Megabyte großen Unicode-Spielstand. Mit ausschließlich dort generierten Schlüsseln prüft es signierte Eingaben, Manipulation, Pending, wiederholte Ereignisse, widerrufenen Besitz, Keystore und Offline-Neulesen. Es prüft außerdem die Erinnerung über den Sommer- und Winterzeitwechsel und nach einer Reise. Alle 19 Fälle haben bestanden. | [Protokoll API 34](../release/android/qa-plattform/instrumentierung-api34.txt) · [Instrumentierungsfälle](app/src/androidTest/java/de/quizsalon/app/NativeChecks.java) |

Die Systembildschirme in den Meilensteinverzeichnissen stammen aus `adb shell screencap`. Die Prüfroutine steuert Antwort- und Navigationstasten mit Android-Eingabeereignissen an. Prüferwartungen für Fragen stammen jeweils aus dem tatsächlich installierten Fragenkatalog.

## Verbleibende Abnahmen

* Das Prüfabbild mit API 34 enthält keinen TalkBack-Dienst. Auf API 36 lief die oben dokumentierte Gestenprüfung mit dem echten Dienst. Die subjektive Verständlichkeit der deutschen Sprachausgabe und eine Bedienrunde durch Personen aus der Zielgruppe stehen aus.
* Ein Kauf, ausstehende Zahlung samt Erfolg und Abbruch, tatsächlicher Preis, Wiederherstellung eines gekauften Produkts, Erstattung mit Entzug und Offline-Start mit echtem Beleg benötigen die echte Play-App, das konfigurierte Produkt und ein freigeschaltetes Lizenztestkonto. Die normale Vorschau zeigte ohne diese Voraussetzungen keinen Preis und erlaubte keinen Kauf. Die Instrumentierungsfälle prüfen nur die lokale Verarbeitung.
* Google-Cloud-Sicherung in einem Konto, Übertragung auf ein zweites physisches Gerät, Benachrichtigungsverhalten unter herstellerspezifischen Energiesparmodi und Zielgruppentest stehen aus. Der lokale BackupManager-Lauf verwendet die Systemimplementierung innerhalb desselben Testemulators. [Android-Anleitung zu Backup-Prüfungen](https://developer.android.com/identity/data/testingbackup)
* Es wurde nichts in der Play Console eingereicht oder öffentlich veröffentlicht.

## Reproduktion

Die Build- und Instrumentierungsbefehle stehen in der [Android-Anleitung](README.md). Für die UI- und Sicherungsläufe benötigt der Testrechner Node.js 22, `adb` und einen eigenen AVD mit einem Namen, der mit `Quizsalon` beginnt. Die Modi `daily` und `local` erwarten einen frischen Spielstand, `platform` einen abgeschlossenen Tageslauf mit anfangs unentschiedener Benachrichtigungserlaubnis. `--fresh` löscht die Daten des jeweiligen Quizsalon-Testpakets auf diesem AVD. Die Sicherungsprüfung deinstalliert und installiert nur die zugehörige Vorschau auf dem gewählten Prüfemulator.

```powershell
node tools/android-ui.mjs emulator-5582 release/android/screenshots-final daily --fresh
node tools/android-ui.mjs emulator-5582 release/android/screenshots-final-lokal local --fresh
node tools/android-ui.mjs emulator-5582 release/android/qa-plattform platform
node tools/android-backup.mjs emulator-5582 release/android/Quizsalon-Play-Vorschau.apk release/android/qa-plattform
```

Die TalkBack-Prüfung benötigt das getrennte Instrumentierungs-APK und ein dafür vorbereitetes, temporäres 16-KB-Testgerät. Starte den AVD mit einem freien lokalen gRPC-Port und aktiviertem Zugriffstoken, beispielsweise mit `-grpc 8564 -grpc-use-token`. Der Windows-Prüftreiber liest den kurzlebigen Token aus der Discovery-Datei des gewählten AVD. Stelle seine physische Bildschirmgröße wieder her, aktiviere den vorinstallierten TalkBack-Dienst und verwende für die Tagesrunde einen frischen Vorschau-Testspielstand.

```powershell
adb -s emulator-5584 shell wm size reset
adb -s emulator-5584 shell wm density 360
adb -s emulator-5584 shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/.TalkBackService
adb -s emulator-5584 shell settings put secure accessibility_enabled 1
node tools/android-talkback.mjs emulator-5584 release/android/qa-talkback-gesamtrunde
```

Für die Kaltstartmessung wird TalkBack wieder deaktiviert. Der Aufruf initialisiert die Runde vor dem Messzeitraum und erwartet die bereits installierte Play-Vorschau.

```powershell
node tools/android-ui.mjs emulator-5584 release/android/qa-kaltstart cold --fresh
```
