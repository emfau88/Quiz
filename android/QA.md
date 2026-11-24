# Android-Prüfbericht

## Deutsche Ausgabe 0.4.0

Lokaltest und Play-Vorschau tragen den versionCode 4 und enthalten die 2.400 Fragen des Katalogs `de-d5a1d0585ed1`. Bei beiden APKs stimmen alle 36 gebündelten Dateien byteweise mit den vorgesehenen Quellen überein. Beide APKs sind v2-signiert und bestehen die 16-KB-Ausrichtungsprüfung. Der Android-16-Emulator meldete 16.384 Byte je Speicherseite. In der lokalen Ausgabe fehlen Internet- und Billing-Recht. [APK-Prüfsummen und Berechtigungen](../release/android/artifacts.json)

Vor dem Update beantwortete die installierte 0.3.0-Vorschau jeweils eine Frage in der Tagesrunde und in der Kennenlernrunde Geschichte. Der Spielstand enthielt auch einen früheren Tagesabschluss mit 60 XP. Nach `adb install -r` auf 0.4.0 stimmten Karten und Antworten, Lernstand, Installationskennung, Tagesbuchung, verbrauchte Probe und alle 30 simulierten Einzeltreffer von Ada, Oskar und Mira überein. Die gespeicherte Erklärung führte per Antippen zur zweiten Frage derselben Kennenlernrunde. [Stand vor dem Update](../release/qa/weiterspielen-0.4.0/android-update/spielstand-vor-update.json) · [Prüfung der aktualisierten App](../release/qa/weiterspielen-0.4.0/android-update/android-ui.json)

Nach den Layout- und Offlinekorrekturen wurde das tatsächlich ausgelieferte APK erneut direkt über eine 0.3.0 mit zwei offenen Runden und früherer 60-XP-Buchung installiert. Der zweite Update-Lauf bestätigte dieselben Erhaltungseigenschaften. Die WebView meldete null registrierte Service Worker. Im endgültigen Lokaltest wurden zehn weitere Wetterfragen bis 8/10 gespielt. Die aus der laufenden WebView gelesenen SHA-256-Werte von Stylesheet und Worker stimmten mit den ausgelieferten Dateien überein. Zwischen dem ersten 0.4.0-Prüfpaket und den End-APKs änderten sich innerhalb der APK-Archive ausschließlich diese beiden Dateien. [Zweiter Update-Lauf](../release/qa/weiterspielen-0.4.0/android-update-endstand/android-ui.json) · [Wetterrunde im End-APK](../release/qa/weiterspielen-0.4.0/android-lokal-endstand/android-ui.json) · [Binärer Vergleich](../release/qa/weiterspielen-0.4.0/android-buildabgleich.json)

Alle 19 Instrumentierungsprüfungen liefen auf der installierten 0.4.0-Vorschau erfolgreich. Sie prüfen SQLite-Transaktionen und Migration, lokal verarbeitete signierte Prüfdaten, den verschlüsselten Offlinecache im Android Keystore und Erinnerungstermine. Der Erwerb bei Google Play, die Wiederherstellung und der Offline-Aufruf mit echtem Play-Beleg benötigen weiterhin das konfigurierte Produkt und ein Lizenztestkonto. [Natives Testprotokoll](../release/qa/weiterspielen-0.4.0/android-instrumentierung.txt)

In der regulären Vorschau führte „Noch 5 Fragen“ vom Tagesergebnis unmittelbar zur ersten kostenlosen Kurzrunde. Nach drei Kurzrunden und einer Revanche waren 20 eigene Zusatzantworten im Lernstand. Tagesbuchungen, verbrauchte Proben und der Kaufstatus entsprachen dem Ausgangsstand. Ein Prozessneustart nach Antwort zwei zeigte im Flugmodus dieselbe Erklärung. Jeder neue Tisch wechselte mindestens einen Gast. Die Revanche behielt alle drei Gäste und lieferte fünf neue Sachverhalte. Nach Ausschalten des Vergleichs verschwanden Tisch und Revanche auch im Ergebnis der nächsten vollständig gespielten Kurzrunde. Bei 360 dp blieben alle drei Tabellenköpfe einzeilig, Namen und Fachgebiete standen in eigenen Zeilen. [Freie Runden und Prüfdaten](../release/qa/weiterspielen-0.4.0/android-freie-runden/android-ui.json) · [Kleines Tagesergebnis](../release/qa/weiterspielen-0.4.0/android-freie-runden/01-tagesergebnis.png) · [Quiztisch mit geteilten Plätzen](../release/qa/weiterspielen-0.4.0/android-rangtisch/rangtisch.png)

In der regulären Ausgabe zeigte „Thema wählen“ für Wetter das Plus-Angebot. Im getrennten Lokaltest ließen sich Filmgeschichte und Wetter jeweils gemischt und anspruchsvoll abschließen. Für Tierverhalten gab es die gemischte Runde und einen Verweis auf die anspruchsvolle Hauptrubrik. Alle 50 gespielten Fragen trugen die passenden redaktionellen Schlagwörter. Die zehn Karten jeder Variante entsprachen der Mischung 6/3/1 oder 2/5/3. [Alle Varianten mit Kartenkennungen und Ergebnissen](../release/qa/weiterspielen-0.4.0/android-unterthemen/android-ui.json) · [Reguläres Wetter-Angebot](../release/qa/weiterspielen-0.4.0/android-freie-runden/07-wetter-plus.png)

Der Absender erspielte auf dem ersten Gerät 4 von 5. Der zweite Emulator öffnete dieselbe Einladung am folgenden lokalen Kalendertag in einem eigenständigen Spielstand. Erst beim Spielen entstanden eigene Lernbuchungen. Alle fünf Karten, beide Revisionen und die 20 Antwortpositionen entsprachen dem geteilten Link. Nach zwei Antworten setzte der Empfänger die Runde offline fort und erreichte 3 von 5. Beim erneuten Öffnen erschien sein bestehendes Ergebnis. Ein beschädigter Link bot eine normale Kurzrunde an. Auf beiden Geräten öffnete erst die Teilen-Schaltfläche das Android-Systemmenü. Die Android-Zurück-Taste führte zum unveränderten Spielstand. Der per Schaltfläche kopierte Text ließ sich jeweils vollständig mit der Android-Einfügetaste wieder auslesen. Für den Test im nativen Host wurde das echte Linkfragment lokal in der Debug-WebView geöffnet. Android ordnete den öffentlichen HTTPS-Link dem Chrome-Browser zu. [Versendeter Link und Reihenfolge](../release/qa/weiterspielen-0.4.0/android-freie-runden/einladung.json) · [Prüfung beim Empfänger](../release/qa/weiterspielen-0.4.0/android-freund-empfang/android-ui.json) · [Systemmenü beim Absender](../release/qa/weiterspielen-0.4.0/android-freie-runden/systemmenue.png) · [Ergebnis des Empfängers](../release/qa/weiterspielen-0.4.0/android-freund-empfang/02-euer-vergleich.png)

In einem separaten vollständigen Durchlauf auf dem End-APK war Google TalkBack 16 mit aktiver Berührungserkundung eingeschaltet. Bei 360 dp Breite und 150 Prozent Systemschrift erreichte der Fokus die Zeile „Heute am Tisch mit drei Computergegnern“. Ein Doppeltipp nahm die Einladung an. Für jede der fünf Fragen wechselte eine Wischgeste zwischen echten Antwortschaltflächen. Doppeltipps speicherten genau den fokussierten Wert und aktivierten die Weiteraktion. Das Ergebnis zeigte eine richtige eigene Antwort und den geteilten Wert 4 von 5. Alle fünf Lernbuchungen waren vorhanden, die Tageswertung blieb gleich. Der Fokus erreichte „Ergebnis zurückschicken“, „Noch 5 Fragen“ und „Thema wählen“. Über die Themenwahl ließ sich „Wetter“ als Umschaltfläche auswählen. Eine Person aus der Zielgruppe muss die Verständlichkeit der gesprochenen deutschen Ansagen noch beurteilen. [Gerätedaten](../release/qa/weiterspielen-0.4.0/android-talkback/geraet.txt) · [Gesten und Buchungen](../release/qa/weiterspielen-0.4.0/android-talkback/talkback.txt) · [Einladung](../release/qa/weiterspielen-0.4.0/android-talkback/00-einladung.png) · [Fokus vor der Wischgeste](../release/qa/weiterspielen-0.4.0/android-talkback/01-erste-antwort.png) · [Fokus danach](../release/qa/weiterspielen-0.4.0/android-talkback/02-zweite-antwort.png) · [Auswertung](../release/qa/weiterspielen-0.4.0/android-talkback/03-rundenergebnis.png) · [Ausgewähltes Unterthema](../release/qa/weiterspielen-0.4.0/android-talkback/04-unterthema.png)

Beim Offline-Tageslauf mit zehn Fragen führten sieben richtige Antworten zu einer einzigen Buchung über 90 XP. Zwei Hinweisfragen und eine Schätzfrage trugen die sichtbare Typangabe und verwiesen im zugänglichen Fragetext darauf. Die sechs Store-Bilder haben dieselben RGB-Pixel wie die gerenderten Android-Originale mit 1080 × 1920 Pixeln. [Tageslauf und Originale](../release/qa/weiterspielen-0.4.0/android-galerie/) · [Schätzfrage](../release/qa/weiterspielen-0.4.0/android-galerie/07-schaetzfrage.png) · [Store-Medien](../release/store/)

## Deutsche Ausgabe 0.3.0

Beide installierten APKs tragen den versionCode 3 und enthalten 2.400 Fragen aus dem Katalog `de-d5a1d0585ed1`. Für jedes Paket stimmen alle 22 Webdateien byteweise mit der vorgesehenen Quelle überein. Beide APKs sind v2-signiert und bestehen die 16-KB-Ausrichtungsprüfung. Der Emulator `sdk_gphone16k_x86_64` meldete tatsächlich 16.384 Byte je Speicherseite und API 36. Das lokale Paket besitzt weder Internet- noch Billing-Berechtigung. [Artefaktprüfung und Prüfsummen der 0.3.0](../release/qa/weiterspielen-0.4.0/android-update/artefakte-ausgangsversion-0.3.0.json)

Nach dem Update der installierten 0.2.0-Vorschau blieben die SHA-256-Abdrücke von offener Runde, Fortschritt, Buchungen und Installationskennung identisch. Android zeigte die zuvor gespeicherte Erklärung. Ein Antippen setzte dieselbe Kennenlernrunde an Frage zwei fort. [Spielstand vor dem Update](../release/qa/modern-0.3.0/android-update/session-vor-update.json) · [Prüfung nach dem Update](../release/qa/modern-0.3.0/android-update/android-ui.json)

Der separat installierte Lokaltest schloss im Android-Flugmodus eine anspruchsvolle Themenrunde mit zehn Fragen ab. Die Prüfung bestätigte, dass diese Runde keine Tages-XP buchte und die native Kaufschnittstelle weiter den Status `unavailable` meldete. [Lokaler Durchlauf auf dem Gerät](../release/qa/modern-0.3.0/android-lokal/android-ui.json) · [Themenauswahl](../release/qa/modern-0.3.0/android-lokal/lokaltest-themen.png) · [Themenrunde](../release/qa/modern-0.3.0/android-lokal/lokaltest-themenrunde.png)

Die reguläre Vorschau absolvierte zehn Offline-Tagesfragen mit Prozessneustarts vor und nach einer Antwort sowie vor dem Abschluss. Die sieben richtigen Antworten ergaben 90 XP und genau eine Abschlussbuchung. Der freiwillige Vergleich kennzeichnete drei Computergegner. Die sechs gerenderten Android-Originale sind 1080 × 1920 Pixel groß. Ihre Store-Exporte enthalten dieselben RGB-Pixel. [Tageslauf und Originale](../release/qa/modern-0.3.0/android-galerie/) · [Telefonbilder für den Store](../release/store/)

Alle 19 Instrumentierungsfälle für SQLite, Android Keystore, lokal verarbeitete signierte Prüfdaten und Erinnerungstermine bestanden. Für den Nachweis realer Play-Käufe, Erstattungen und Wiederherstellungen mit einem echten Kaufbeleg fehlen das konfigurierte Play-Produkt und das Lizenztestkonto. [Protokoll der 19 Tests](../release/qa/modern-0.3.0/android-instrumentierung.txt)

Mit Google TalkBack 16.0.0, 360 dp Breite und 150 Prozent Systemschrift ließ sich die gesamte Tagesrunde im Flugmodus bedienen. Für jede der zehn Fragen wechselte der Fokus durch eine Wischgeste zur benachbarten Antwort. Ein Doppeltipp speicherte genau diese Antwort in SQLite. „Nächste Frage“ und „Ergebnis ansehen“ wurden ebenso über den echten TalkBack-Fokus aktiviert. Vier richtige Antworten ergaben 60 XP in genau einer Abschlussbuchung. Die Verständlichkeit der gesprochenen deutschen Ansagen durch eine Person aus der Zielgruppe bleibt offen. [Gerätedaten](../release/qa/modern-0.3.0/android-talkback/geraet.txt) · [Gesten und Buchungen](../release/qa/modern-0.3.0/android-talkback/talkback.txt) · [Fokus vor der Wischgeste](../release/qa/modern-0.3.0/android-talkback/01-erste-antwort.png) · [Fokus danach](../release/qa/modern-0.3.0/android-talkback/02-zweite-antwort.png) · [Ergebnis](../release/qa/modern-0.3.0/android-talkback/03-rundenergebnis.png)

Im ersten Gestenlauf kam die Weiteraktion der zweiten Frage bei einem Doppeltipp nahe dem unteren Bildschirmrand nicht an. Der getrennte Testtreiber prüft nun den exakten Text des fokussierten Android-Buttons und verwendet die Bildschirmmitte für die Aktivierung. Anschließend bestand der oben dokumentierte vollständige Durchlauf auf denselben ausgelieferten APKs. [Erster Gestenversuch](../release/qa/modern-0.3.0/android-talkback/erster-gestenversuch.txt)

## Deutsche Ausgabe 0.2.0

Lokale APK und reguläre Vorschau tragen Version 0.2.0, versionCode 2 und den Katalog `de-03c46c2cd256`. Die Prüfung hat jede gebündelte Webdatei jeweils byteweise mit der vorgesehenen Quelle verglichen, beide APK-Signaturen und 16-KB-Ausrichtung geprüft sowie die getrennten Berechtigungen der beiden Ausgaben bestätigt. Die lokale APK enthält weder Internet- noch Billing-Berechtigung. [Artefaktprüfung und Prüfsummen der 0.2.0](../release/qa/modern-0.3.0/android-update/artefakte-ausgangsversion-0.2.0.json)

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

Für 0.4.0 liefert der Galerielauf das gespeicherte Tagesergebnis für den Absender. Die Freundesprüfung liest den tatsächlich erspielten Link aus dessen Bericht. Die beiden Seriennummern bezeichnen getrennte Test-AVDs. Für einen Update-Lauf bereitet `continue-before --fresh --seed-history` die installierte 0.3.0 vor. Nach `adb install -r` auf das neue Vorschau-APK prüft `continue-after` im selben Ausgabeverzeichnis den offenen Stand.

```powershell
$qa = 'release/qa/weiterspielen-0.4.0'
node tools/android-ui.mjs emulator-5586 "$qa/android-galerie" gallery --fresh
node tools/android-ui.mjs emulator-5586 "$qa/android-freie-runden" continue-regular
node tools/android-ui.mjs emulator-5586 "$qa/android-rangtisch" continue-table
node tools/android-ui.mjs emulator-5586 "$qa/android-unterthemen" continue-local --fresh
node tools/android-ui.mjs emulator-5582 "$qa/android-freund-empfang" continue-friend --fresh "--invite=$qa/android-freie-runden/einladung.json"
```

Der TalkBack-Empfänger verwendet den installierten Google-Dienst und die echte Touch-Eingabe des authentifizierten Emulators. Für das physische 1080 × 2400-Display ergeben 480 dpi eine Breite von 360 dp. Mit aktivem TalkBack, Systemschrift 1.5, frischer Vorschau und installiertem Test-APK prüft derselbe Absender-Link Annahme, fünf Antworten und Auswertung.

```powershell
node tools/android-talkback.mjs emulator-5582 "$qa/android-talkback" "$qa/android-freie-runden/einladung.json"
```

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
