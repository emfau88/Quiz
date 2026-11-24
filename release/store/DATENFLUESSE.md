# Datenflüsse für Datenschutzseite und Data Safety

Arbeitsstand für die künftige Play-Ausgabe. Eine öffentliche Betreibererklärung setzt die tatsächliche verantwortliche Stelle, den Kontakt und die Betreiberfreigabe voraus.

| Daten | Zweck und Ort | Übertragung und Löschung |
| --- | --- | --- |
| Beantwortete Fragen, Reihenfolge, Zeiten, Fortschritt, Auszeichnungen | Lokale Runde, Wiederholung und Wissensalbum. Browser in IndexedDB, native Ausgabe in einer privaten SQLite-Datenbank. | Keine Übermittlung durch das Spiel. Lokales Zurücksetzen löscht den Spielstand. |
| Einstellungen und Erinnerungszeit | Lokale Darstellung, freiwillige Gerätemitteilung zur gewählten Ortszeit | Keine Quiz-Telemetrie. Ausschalten entfernt die geplante Erinnerung. |
| Zufällige Installationskennung | Auswahl von Fragen, Antworten und Computerergebnissen | Lokal. Im APK vom Systembackup ausgeschlossen. |
| Kaufbeleg, Produkt, Bestätigungsstatus | Google Play liefert die Kaufdaten. Der native Client prüft Identität und Signatur und speichert den bestätigten Zugang geschützt auf dem Gerät. | Kauf, Bestätigung und Wiederherstellung über den Google-Play-Dienst. Der Gerätespeicher für Käufe ist vom Backup ausgeschlossen. |
| Android-Spielstandbackup | Wiederherstellung der zugelassenen Spielstanddaten über das Betriebssystem | Abhängig von Android-Version, Gerätehersteller und den Sicherungseinstellungen des Nutzers. |
| Frage melden | Formulierung einer freiwilligen Rückmeldung mit Frage-ID, Revisionen und App-Version | Inhalt kann kopiert oder bei vorhandener Supportadresse im gewählten Mailprogramm vorbereitet werden. Der Nutzer versendet selbst. |
| Externe Belegseiten | Nachlesen einer Quellenangabe | Beim bewussten Öffnen kontaktiert der Browser die gewählte Website. |
| Freiwilliger Freundeslink und Ergebnisantwort | Fünf Kartenkennungen mit Revisionen und Antwortreihenfolgen sowie die Trefferzahl im URL-Fragment. Der Empfänger kann beide Trefferzahlen als Text zurücksenden. | Beim Teilen wählt der Spieler die empfangende App. Beim Kopieren landet der Inhalt in der Systemzwischenablage. Der Browser ruft die öffentliche GitHub-Pages-Spielseite auf. Das Fragment bleibt beim HTTP-Abruf im Browser. |

Die lokale HTML-Testdatei enthält Fragen, Bild und Schriften. Sie benötigt nach dem Öffnen keine Internetverbindung. Ihr lokaler Themenzugang ist eine Eigenschaft dieser Testausgabe. Es entsteht kein Kaufdatensatz.

Für die spätere Play-Deklaration sind das endgültige Artefakt, die Konfiguration seiner Bibliotheken, der gewählte Support-/Mailanbieter und die tatsächliche Datenverarbeitung des Betreibers maßgeblich. Änderungen an Analytics, Versand oder Backend würden eine neue Prüfung erfordern. [Google-Play-Nutzerdatenrichtlinie](https://support.google.com/googleplay/android-developer/answer/10144311?hl=de)
