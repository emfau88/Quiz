# Quizsalon für Android

Die App lädt die mitgelieferte HTML-Oberfläche aus `../web/` in der System-WebView. Der native Host stellt SQLite, Google Play Billing, lokale Erinnerungen und die Android-Zurücknavigation bereit. Das APK enthält Fragen und Schriften. Dateien eines neuen Katalogs werden durch ein App-Update ausgeliefert.

Für die vollständige lokale Erprobung aller Funktionen verwende [Quizsalon Lokaltest](../release/android/Quizsalon-Lokaltest.apk). Die [Play-Vorschau](../release/android/Quizsalon-Play-Vorschau.apk) enthält die echte Kaufintegration. Die beiden Apps können nebeneinander installiert werden. [Android-Prüfbericht](QA.md) · [Prüfsummen](../release/android/artifacts.json)

## Build

Vorausgesetzt sind JDK 17, das Android-SDK mit Plattform 36 und die vom Gradle-Wrapper verwendeten Build Tools. Setze `ANDROID_HOME` auf das SDK-Verzeichnis. Das Projekt bindet das Android Gradle Plugin 8.13.1, Gradle 8.14 und Play Billing 8.0.0 ein. Der Wrapper prüft die SHA-256-Summe seiner Distribution. Ein erster Build lädt fehlende Abhängigkeiten aus den konfigurierten Repositories.

Im Projektstamm auf Windows ausführen. Auf Linux und macOS lautet der Wrapper `./android/gradlew`.

```powershell
.\android\gradlew.bat -p android :app:assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Die Vorschau trägt die Paketkennung `de.quizsalon.vorschau`, den versionCode 2 und die Version 0.2.0. Mindestversion ist Android 7.0 (API 24), Ziel ist Android 16 (API 36). Das Debug-Zertifikat dient lokalen Installationen.

Für die lokale Erprobung aller Themen und beider Schwierigkeitsstufen gibt es den zusätzlichen Build `:app:assembleLocalTest`. Er installiert sich als **Quizsalon Lokaltest** (`de.quizsalon.lokaltest`), verwendet einen eigenen Spielstand und initialisiert keinen Play-Billing-Client. Gradle überlagert nur in dieser Variante `js/access.js` mit dem lokalen Zugangsmodul aus `tests/local-theme-access.js`. Dieses Modul kennzeichnet Themenrunden als Lokaltest. Die normale Vorschau und der Release verwenden das Produktionsmodul aus `web/js/access.js`.

Für einen Release müssen die folgenden Variablen im Buildprozess gesetzt sein. Private Schlüssel und Passwörter bleiben außerhalb des Projekts und von Buildausgaben. `QUIZSALON_PLAY_PUBLIC_KEY` ist der öffentliche RSA-Lizenzschlüssel der konkreten Play-App im Base64-Format.

| Variable | Wert |
| --- | --- |
| `QUIZSALON_APPLICATION_ID` | Endgültiger, bestätigter Paketname |
| `QUIZSALON_PLAY_PUBLIC_KEY` | Öffentlicher Play-Lizenzschlüssel |
| `QUIZSALON_KEYSTORE` | Absoluter Dateipfad zum autorisierten Upload-Keystore |
| `QUIZSALON_KEY_ALIAS` | Upload-Schlüsselalias |
| `QUIZSALON_STORE_PASSWORD` | Keystore-Passwort aus dem Secret Store |
| `QUIZSALON_KEY_PASSWORD` | Schlüsselpasswort aus dem Secret Store |

Für öffentliche Betreiberinformationen übernimmt der Release-Build zusätzlich `QUIZSALON_OPERATOR`, `QUIZSALON_SUPPORT_EMAIL` und `QUIZSALON_PRIVACY_URL`. Die lokale Vorschau liefert dafür leere Werte. Im öffentlichen Kandidaten sind Anschrift, erreichbarer Support und verbindliche, öffentlich zugängliche Datenschutzerklärung durch den Betreiber zu prüfen.

```powershell
.\android\gradlew.bat -p android :app:bundleRelease :app:assembleRelease
```

Die Buildaufgabe `checkReleaseIdentity` prüft die Identität vor einem Release-Build. Lade im internen Track das AAB mit dem vorgesehenen Paketnamen hoch. Veröffentliche im zugehörigen Play-Projekt das nicht verbrauchbare Produkt `quizsalon_plus` mit einer dauerhaften Standardkaufoption, ohne Mietoption, Mehrfachmenge oder Rabattangebot. Der deutsche Preisvorschlag aus dem Produktplan wird in der Console konfiguriert. Die App zeigt den lokalisierten Preis aus `ProductDetails`.

`checkReleaseCatalog` baut den vollständigen Fragenbestand mit `tools/catalog.py --stage release` in einem temporären Projekt. Katalog, Manifest und Spielregeln müssen mit den auszuliefernden HTML-Assets übereinstimmen. Dazu werden Python und die Pakete aus `requirements.txt` benötigt. Bei Bedarf verweist `QUIZSALON_PYTHON` auf den passenden Interpreter. Beide Prüfungen gehören zum Release-Build.

## Speicherung

Die Spielregeln berechnen eine Änderung im HTML-Kern. Die SQLite-Transaktion vergleicht die gelesene Revision und schreibt die neue Revision und alle Teile des Spielstands gemeinsam. Ein veralteter Schreibversuch schlägt fehl und kann vom Aufrufer neu berechnet werden. Der Host zerlegt größere JSON-Spielstände in kleine Datenbankzeilen, damit sie auch jenseits des Android-CursorWindow-Limits lesbar bleiben. Beim Wechsel von Datenbankschema 1 auf 2 führt SQLite die Migration atomar durch.

Die Android-Backup-Regeln erlauben ausschließlich die Spielstanddatenbank und die Erinnerungseinstellungen. Die neue Installation erzeugt eine eigene zufällige Kennung in `no_backup`. Kaufbelege und Verarbeitungsstatus liegen in einer eigenen, atomar geschriebenen AES-GCM-Datei in `no_backup`. Der Schlüssel verbleibt im Android Keystore. Bei Wiederherstellung auf einem neuen Gerät fragt die App Google Play nach dem erworbenen Produkt. Ob Android einen Spielstand sichert, hängt von Gerät, Systemeinstellungen, Transport und der Systemquote ab. [Android Auto Backup](https://developer.android.com/identity/data/autobackup)

## Kaufverarbeitung

Beim Start, bei Wiederaufnahme, nach Netzrückkehr und beim Wiederherstellen fragt die App den Besitz nicht verbrauchbarer Produkte ab. Erst ein zum Paket und Produkt passender, signierter Originalbeleg mit Kauf-Token, Einzelmenge und Status PURCHASED erlaubt Plus. Signiert werden die Originalbytes des Play-Kaufobjekts. Die lokale Prüfung unterstützt RSA PKCS#1 v1.5 mit SHA-256 und SHA-1. Ein bereits gesicherter Beleg wird beim Offline-Start erneut geprüft. Für die Produktion fehlt noch der Nachweis gegen den Lizenzschlüssel und tatsächliche Belege des Betreiberprojekts. [Purchase-Referenz](https://developer.android.com/reference/com/android/billingclient/api/Purchase) · [Integration](https://developer.android.com/google/play/billing/integrate)

Bei ausstehender Zahlung wartet die App auf den Abschluss. Die App bestätigt einen Kauf nach der dauerhaften Speicherung. Fehlgeschlagene Bestätigungen werden beim erneuten Abgleich wiederholt. Ein vollständiges erfolgreiches Online-Inventar ohne den zuvor bestätigten Kauf entzieht den Zugang. Verbindungsfehler erhalten die gespeicherte Berechtigung. Ein lokaler Client kann manipuliert werden und erfährt einen Widerruf erst beim erfolgreichen Abgleich. Eine Erstattung ohne Widerruf kann bestehenden Besitz weiter anzeigen. [Kaufabsicherung](https://developer.android.com/google/play/billing/security) · [Play-Lizenztests](https://developer.android.com/google/play/billing/test?hl=en)

Die WebView akzeptiert Ressourcen aus der gebündelten lokalen HTTPS-Herkunft. Externe Quellenlinks öffnen den Systembrowser. Die APK-Anwendungsrechte enthalten durch die Billing-Abhängigkeiten auch INTERNET und Netzwerkstatus. Das zusammengeführte Manifest enthält Googles Datentransport-Komponenten. Für die rechtliche Erklärung sind die SDK-Datenpraktiken der konkret eingereichten Version zu prüfen. [Google-Play-Angaben zur Datensicherheit](https://support.google.com/googleplay/android-developer/answer/10787469)

## Erinnerungen und Bedienung

Standardmäßig sind Erinnerungen aus. Nach Auswahl einer lokalen Zeit fordert die App ab Android 13 die Benachrichtigungserlaubnis an. Der Alarm ist ungenau. Das System kann ihn zum Energiesparen verschieben. Neustart, Zeitzonenwechsel und Uhrzeitänderungen lösen eine Neuberechnung aus. Bei deaktivierter Erinnerung wird der Alarm entfernt. [Benachrichtigungen](https://developer.android.com/develop/ui/views/notifications/notification-permission) · [Alarme](https://developer.android.com/develop/background-work/services/alarms)

Der Host berücksichtigt Systemleisten, Tastatur und die Android-Schriftgröße und übergibt die HTML-Semantik an die WebView-Zugänglichkeitsbrücke. Der Debug-Build erlaubt lokale WebView-Inspektion per ADB. Der Release-Build deaktiviert sie.

Das getrennte Test-APK enthält Instrumentierungsprüfungen und erzeugt flüchtige Test-Schlüssel ausschließlich in diesen Prüfungen. Die Kaufmatrix mit echten Play-Zahlungswegen ist Teil der externen Abnahme.

```powershell
.\android\gradlew.bat -p android :app:assembleDebug :app:assembleDebugAndroidTest
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w -r de.quizsalon.vorschau.test/de.quizsalon.app.NativeChecks
```

Vor einer Einreichung erneut die offiziellen Fristen prüfen. Die am 20.11.2026 abgerufenen Tabellen nennen API 36 für neue Smartphone-Apps und August 2027 als reguläre Einreichungsgrenze für Billing 8. [Ziel-API](https://developer.android.com/google/play/requirements/target-sdk) · [Billing-Fristen](https://developer.android.com/google/play/billing/deprecation-faq) · [16-KB-Seiten](https://developer.android.com/guide/practices/page-sizes)
