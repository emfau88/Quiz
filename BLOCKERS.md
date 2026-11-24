# Externe Abhängigkeiten

Die Browser-Testausgabe ist öffentlich spielbar. Der Betreiber entscheidet nach seinem lokalen Test über eine Veröffentlichung bei Google Play. Dafür fehlen die unten aufgeführten Voraussetzungen. Die technische Kaufprüfung umfasst isolierte Statusfälle und signierte Prüfdaten auf dem Emulator. Ein Kaufbeleg aus einem echten Play-Konto steht aus. [Spiel-Link](https://emfau88.github.io/Quiz/spielen.html?v=0.4.0) · [Prüfung der Zugangswege](release/qa/weiterspielen-0.4.0/themen.json)

| Bereich | Benötigter Beitrag | Bis dahin möglich |
| --- | --- | --- |
| Play-Identität und Einmalkauf | Endgültige Paket-ID, zugehöriger öffentlicher Play-Lizenzschlüssel, Zugang zur App im internen Track, eingerichtetes Produkt quizsalon_plus und Lizenztestkonto | Vorschau-APK, echte Bibliothek, Signaturprüfung und technische Tests |
| Betreiber und Datenschutz | Verantwortlicher, reale Supportadresse und dauerhaft erreichbare Datenschutz-URL | Store-Texte, Datenflussinventar, lokale Meldungsvorlage |
| Signierung | Betreiberkontrollierter Upload-Key mit sicherem lokalem Zugang | Debugsignierte Testfassung und vorbereiteter Release-Build |
| Geräte und Zielgruppe | Physisches Android-Gerät, Beurteilung der Sprachausgabe durch einen TalkBack-Nutzer und echte Teilnehmer für die Zielgruppenstudie | Vollständiger Gestendurchlauf mit Google TalkBack auf dem Android-16-Emulator, Browserprüfungen und Beobachtungsbogen |
| Google-Play-Veröffentlichung | Abschließende Entscheidung über den belegten Release-Kandidaten und eigener Play-Zugriff | Öffentliche Browser-Testausgabe und lokale Android-Tests |
