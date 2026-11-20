# Quizsalon Abnahme und Veröffentlichung

Diese Checkliste wird im Implementierungsrepository als RELEASE_CHECKLIST.md gepflegt. Alle Punkte starten offen. Ein Haken benötigt einen überprüfbaren Nachweis: Build, Commit, Testausgabe, Gerät, Screenshot oder tatsächlicher Console-Status. Die Erstellung dieser Checkliste bedeutet nicht, dass irgendeiner dieser Tests bereits erfolgt ist.

## 1 Technische Funktionsabnahme

### Runde und Persistenz

- [ ] Erststart führt ohne Konto und ohne Berechtigungsdialog zur spielbaren Runde.
- [ ] Normalfall: zehn Fragen, vier Antworten, passende Erklärungen, manuelles Weiter.
- [ ] Proberunde: fünf Fragen in einer Kategorie, keine Tages-XP.
- [ ] Falsche Antwort, richtige Antwort und mehrfaches Tippen wurden geprüft.
- [ ] App-Prozess vor Antwort, nach Antwort und auf der Erklärung beendet; Fortsetzung korrekt.
- [ ] Antwortreihenfolge und Fragen bleiben bei Neustart identisch.
- [ ] Antwort, Lernfortschritt und konkreter Wiedergewusst-Hinweis werden gemeinsam und genau einmal gespeichert.
- [ ] Pausieren bleibt active; bestätigtes Aufgeben setzt abandoned und erklärt die Folgen.
- [ ] Offene alte Tagesrunden sind im Verlauf fortsetzbar; höchstens eine Themen- oder Proberunde ist aktiv.
- [ ] Genau eine Tagesrunde pro lokalem day_key.
- [ ] Start vor Mitternacht, Abschluss danach und parallele heutige Runde korrekt.
- [ ] Zeitzonenwechsel, Sommerzeit und versehentlich vor-/zurückgestellte Uhr blockieren nicht dauerhaft.
- [ ] Kein Duplikat einer Frage oder desselben fact_key innerhalb einer Runde.
- [ ] Kein versehentliches Abfragen reservierter Fragen aus anderen offenen Sessions.
- [ ] Erschöpfter Pool, fehlende Fälligkeiten und kleine Kategorie-Teilmengen führen zu erklärten Ersatzfällen.
- [ ] Bestehender Spielstand überlebt App- und Datenbankupdate.

### Fortschritt

- [ ] Beispiel 7/10 erzeugt genau 90 Tages-XP.
- [ ] Tagesbonus und Antwortauswertung bleiben auch bei wiederholten Events einmalig.
- [ ] Themenrunden beeinflussen Album und Historie, aber weder Tages-XP noch Wochenziel.
- [ ] Pro Kategorie lässt sich die kostenlose Proberunde genau einmal regulär starten und fortsetzen.
- [ ] Probestatus und Probesession entstehen atomar; die 3/2/0-Mischung und das Aufgeben wurden geprüft.
- [ ] Die Stufenübergänge 0, 80, 250, 500 und danach je 500 weitere XP funktionieren.
- [ ] Vier verschiedene abgeschlossene Tagesdaten erfüllen das Wochenziel.
- [ ] Wiedergewusst erscheint nur unter der festgelegten Fehler- und Abstandsregel.
- [ ] Sicher gewusst erfordert zwei richtige Antworten im nötigen zeitlichen Abstand.
- [ ] Fehler nach einer Auszeichnung erzeugen Wiederholungsbedarf, ohne Sammlung zu löschen.
- [ ] Erstversuchs- und Wiederholungsquoten bleiben getrennt.
- [ ] Inhaltskorrektur erhöht die richtigen Revisionen; alte Ergebnisse bleiben nachvollziehbar.
- [ ] Das Wissensalbum zeigt bekannte falsche Erklärungen nicht unmarkiert weiter an.
- [ ] Zurückgezogene Fragen werden in offenen Runden neutral behandelt; C/N, XP, Mindest-N für Medaillen und ausgeblendeter Vergleich stimmen.
- [ ] Niemand wird mit erfundenen Bevölkerungs-, IQ- oder Altersgruppenwerten verglichen.

### Virtuelle Gegner

- [ ] Die Kennzeichnung Computergegner ist verständlich und sichtbar.
- [ ] Gegnerergebnisse werden vor dem Nutzerergebnis gespeichert.
- [ ] Neustart, Ergebnisaufruf oder schwache Nutzerleistung verändern diese Werte nicht.
- [ ] Gleichstände werden korrekt dargestellt.
- [ ] Abschalten beeinflusst keine Belohnung.
- [ ] Bei einer zurückgezogenen Frage wird die Vergleichstabelle ausgeblendet.

## 2 Contentabnahme

- [ ] 1.200 release_approved-Fragen, 200 pro Kategorie.
- [ ] Je Kategorie 120 leicht, 60 mittel, 20 anspruchsvoll.
- [ ] 150 Referenzfragen vorhanden; 25 pro Kategorie.
- [ ] Jede freigegebene Frage besitzt geöffneten Quellenbeleg, Faktenprüfung und unabhängigen redaktionellen Prüfdurchgang.
- [ ] Tatsächliche Prüferart dokumentiert; kein Agent als Mensch ausgegeben.
- [ ] Antwortschlüssel, Eindeutigkeit und vier unterschiedliche Optionen geprüft.
- [ ] Exakte und semantische Dubletten untersucht; Mengenbericht zählt keine bloßen Umformulierungen als unterschiedliche Inhalte.
- [ ] Textlängen einschließlich begründeter Ausnahmen validiert.
- [ ] Keine Entwürfe, ungeklärten Aussagen oder abgelaufenen Fragen im Release.
- [ ] Alle Bilder, Schriften, Töne und übernommenen Bestandteile besitzen dokumentierte Nutzungsrechte.
- [ ] Runtime-Katalog und Inhaltsmanifest reproduzierbar gebaut.
- [ ] Keine offenen kritischen Sachfehler.
- [ ] Im Zielgruppentest tatsächlich verwendete Fragen und konkrete Rückmeldungen dokumentiert.

## 3 Gestaltung und Geräte

- [ ] Alle Kernansichten auf kleiner Anzeige bei 360x640 und 360x800 logischen Pixeln geprüft.
- [ ] Reale Android-Systemschrift bei 100, 150 und maximaler Einstellung geprüft.
- [ ] Keine abgeschnittene Frage, Antwort oder Schaltfläche.
- [ ] Antwortflächen wachsen; Scrollen funktioniert ohne Textverkleinerung.
- [ ] Textkontrast mindestens 4,5:1; richtige und falsche Zustände sind ohne Farbe verständlich.
- [ ] Ein kompletter Durchlauf mit TalkBack wurde tatsächlich ausgeführt.
- [ ] Fokus nach Antwort und Weiter nachvollziehbar; keine störenden Doppelansagen.
- [ ] Ton, Haptik und reduzierte Bewegung funktionieren.
- [ ] Mindestens ein echtes Android-Smartphone geprüft, zusätzlich Emulatoren für gezielte Plattformfälle.
- [ ] App startet und spielt im Flugmodus; Kaufzustand erklärt fehlende Verbindung.
- [ ] App läuft mit 16-KB-Speicherseiten ohne erzwungenen Kompatibilitätsmodus.
- [ ] Systembackup und Wiederherstellung geprüft; Kaufcache und Token werden ausgeschlossen.
- [ ] Wiederhergestellte Sessions funktionieren mit neuer Installation-ID.
- [ ] Freiwillige Reminder funktionieren bei Ablehnung, Deaktivierung, Neustart und Zeitzonenwechsel.
- [ ] Sichtbare Fehlerfälle erlauben Fortsetzung oder einen verständlichen nächsten Schritt.

Performanceziele werden auf einem benannten mittleren Referenzgerät gemessen. Zielwerte: erster bedienbarer Bildschirm ungefähr innerhalb von zwei Sekunden bei normalem Start; Antwortfeedback ohne wahrnehmbare Pause; kein sichtbares Stocken bei Übergängen. Dies sind Produktziele, keine behaupteten Messwerte. Verwende Profil- oder Release-Builds für die Beurteilung und dokumentiere Abweichungen.

## 4 Echte Käufe

V1 verkauft ein nicht verbrauchbares Produkt. Die Integration nutzt den tatsächlichen lokalisierten Play-Preis und einen sichtbaren Weg zur Kaufwiederherstellung. Automatisierte Zustandsprüfungen werden durch echte Play-Lizenztests ergänzt.

- [ ] Produkt existiert im richtigen Play-Projekt und ist im Test verfügbar.
- [ ] Erfolgreicher Kauf mit passender Produkt-/Paketidentität geprüft.
- [ ] Kaufdaten und Originalsignatur entsprechend aktueller Dokumentation lokal geprüft.
- [ ] Keine pauschal wahre Verifikation und kein Test-Unlock im Produktionsbuild.
- [ ] Nutzerabbruch erzeugt weder Kauf noch Fehlalarm.
- [ ] Abgelehnte Zahlung schaltet nichts frei.
- [ ] PENDING bleibt ohne Plus; späterer Erfolg beziehungsweise Abbruch wird verarbeitet.
- [ ] App-Ende während des Kaufablaufs wurde geprüft.
- [ ] Mehrfach gelieferte Kaufereignisse bleiben idempotent.
- [ ] Bestätigung erfolgt nach dauerhafter Verarbeitung; wiederholter Fehler wird erneut versucht.
- [ ] Das Produkt wird nicht konsumiert.
- [ ] Neuinstallation und Wiederherstellung auf dem passenden Play-Konto funktionieren.
- [ ] Bestätigtes Plus bleibt bei Offline-Neustart nutzbar.
- [ ] Ein Netzwerkfehler wird nicht als Entzug behandelt.
- [ ] Ein erfolgreicher vollständiger Abgleich ohne Berechtigung aktualisiert den Zugang verständlich.
- [ ] Erstattung mit Widerruf getestet; tatsächlicher Entzug beim nächsten erfolgreichen Abgleich erkannt.
- [ ] Bereits gekauftes Plus wird nicht erneut zum Kauf angeboten.
- [ ] Kauf-Token und Schlüssel erscheinen weder im Log noch im Repository noch im Systembackup.

Die reguläre Bestätigungsfrist beträgt laut Integrationsdokumentation drei Tage ab PURCHASED. Play-Lizenztests arbeiten mit beschleunigten Fristen. Erstattung und Widerruf sind unterschiedliche Vorgänge; eine Erstattung ohne Entzug beendet die Berechtigung nicht automatisch. Ohne eigenes Backend ist weder ein sofortiger Offline-Widerruf noch eine manipulationssichere lokale Berechtigung möglich. Diese Grenzen sind in DECISIONS.md dokumentiert.

Relevante Primärquellen: [Integration](https://developer.android.com/google/play/billing/integrate), [Absicherung](https://developer.android.com/google/play/billing/security), [Testfälle](https://developer.android.com/google/play/billing/test), [Flutter-Paket](https://pub.dev/packages/in_app_purchase).

Für den letzten Abnahmedurchlauf wird ein über Play ausgelieferter Testbuild verwendet. Das ist unser Qualitätsgate; es behauptet nicht, dass jeder Entwicklungstest technisch einen Store-Upload benötigt. Testkonten werden als Lizenztester eingerichtet, damit die vorgesehenen Testzahlungswege verfügbar sind.

## 5 Zielgruppentest

Erster Beobachtungstest: ungefähr fünf quizinteressierte Personen zwischen etwa 50 und 70 mit unterschiedlicher Smartphone-Erfahrung. Sie öffnen die App ohne Erklärung und spielen eine Runde. Beobachte Einstieg, Lesen, Antwortauswahl, Erklärung und Ergebnisverständnis.

Alltagstest: ungefähr 12 bis 15 passende Personen über sieben bis vierzehn Tage. Sie erhalten keine tägliche Aufforderung durch den Entwickler zum Spielen. Eine selbst aktivierte App-Erinnerung ist erlaubt und wird im Testprotokoll vermerkt.

Erfasse nur echte Beobachtungen:

- Wer startet und beendet ohne Hilfe?
- Wo entstehen Fehlbedienungen oder Leseschwierigkeiten?
- Welche Fragen sind unklar, zu leicht oder frustrierend?
- Wird die virtuelle Runde als Computervergleich verstanden?
- Wer kehrt freiwillig an mehreren Tagen zurück?
- Ist die Plus-Leistung verständlich?
- Was fehlt den Nutzern konkret?

Als interne Produktentscheidung gilt ein Warnsignal, wenn weniger als ungefähr die Hälfte der interessierten Testpersonen an mindestens vier Tagen innerhalb einer vollständigen Testwoche freiwillig spielt. Das ist kein wissenschaftlicher Marktbenchmark und keine formale Store-Vorschrift. Bei schwacher Rückkehr werden Fragen, Schwierigkeit und Einstieg überarbeitet. Ein technischer Release kann weiter vorbereitet werden; die Produktannahme wird nicht als bestätigt ausgegeben.

Ergebnisse nennen Stichprobe, Zeitraum, Build und tatsächliche Nutzung. Keine simulierten Testpersonen und keine hochgerechneten Marktprognosen.

## 6 Store-Paket

Folgende Dateien gehören zur Übergabe:

- [ ] Store-Titel mit höchstens 30 Zeichen.
- [ ] Kurzbeschreibung mit höchstens 80 Zeichen.
- [ ] Beschreibung mit höchstens 4.000 Zeichen.
- [ ] Store-Icon 512x512 als geeignetes PNG, innerhalb der aktuellen Dateigrößenvorgabe.
- [ ] Feature Graphic 1024x500 ohne Alpha.
- [ ] Mindestens vier echte Telefon-Screenshots; Zielgröße 1080x1920.
- [ ] Mindestens drei Screenshots zeigen tatsächliches Spiel beziehungsweise zentrale Spielfunktionen.
- [ ] Bildschirmtexte auch im Store gut lesbar; keine winzig eingerahmten Geräte.
- [ ] Plus-Leistungsumfang und Einschränkung neuer Fragen korrekt beschrieben.
- [ ] Computergegner sichtbar als virtuell beschrieben.
- [ ] Keine erfundenen Spielerzahlen, Bewertungen oder Gesundheitsversprechen.
- [ ] Supportadresse, reale Betreiberangaben und öffentlich erreichbare Datenschutzseite.
- [ ] Datenflussinventar und passende Data-Safety-Angaben.
- [ ] Zielgruppenangabe und Inhaltsbewertung passend ausgefüllt; beides nicht verwechseln.
- [ ] Inhaltliche und technische App-Zugangsangaben für Google vollständig.

Formate und Textlimits stammen aus den aktuellen [Store-Einrichtungsregeln](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en) und [Medienvorgaben](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en). Prüfe sie vor Upload erneut.

## 7 Build und Console

- [ ] Paketname endgültig festgelegt und bestehende Projektidentität geprüft.
- [ ] App-Name überprüft; tatsächliche Namens-/Markenkonflikte nicht ignoriert.
- [ ] Toolchain und Abhängigkeiten festgehalten.
- [ ] Target-API zum Releasezeitpunkt gültig; Recherchewert 20.11.2026 mindestens API 36.
- [ ] Tatsächlich eingebundene native Billing-Version gültig; Recherchewert mindestens 8.
- [ ] Native Bibliotheken auf 16-KB-Kompatibilität geprüft.
- [ ] Release-AAB korrekt signiert; kein Debug-Zertifikat.
- [ ] Upload-Key und Passwörter außerhalb des Repositories und aus Logs ausgeschlossen.
- [ ] versionCode erhöht; versionName und Inhaltsversion nachvollziehbar.
- [ ] AAB und APK mit SHA256, Commit und Build-Datum dokumentiert.
- [ ] Passenden Test-Track eingerichtet und installierbaren Testlink beziehungsweise APK bereitgestellt.
- [ ] Pre-launch-Bericht und technische Console-Meldungen geprüft.
- [ ] Einmalkauf im passenden Store-Projekt aktiv und getestet.
- [ ] Aktuelle Kontovoraussetzungen tatsächlich geprüft.
- [ ] Echte Betreiberangaben vollständig; kein Platzhalter in einer öffentlichen Rechtstextseite.

Google nennt für betroffene persönliche Konten nach dem 13.11.2023 mindestens zwölf über mindestens 14 Tage kontinuierlich angemeldete Testpersonen und einen anschließenden Antrag auf Produktionszugang. Ob dies hier greift, wird am bestehenden Konto geprüft. Keine allgemeine zusätzliche Wartezeit erfinden und keine Tester ersetzen oder vortäuschen.

Quellen: [Target API](https://developer.android.com/google/play/requirements/target-sdk), [Billing-Fristen](https://developer.android.com/google/play/billing/deprecation-faq), [16 KB](https://developer.android.com/guide/practices/page-sizes), [Flutter-Release](https://docs.flutter.dev/deployment/android), [Kontotests](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## 8 Freigabe und Abschluss

- [ ] Keine offenen kritischen oder schwerwiegenden Defekte.
- [ ] Bekannte kleinere Einschränkungen verständlich dokumentiert.
- [ ] Öffentlicher Veröffentlichungsauftrag liegt vor oder konkrete Freigabeunterlagen sind vollständig vorbereitet.
- [ ] Einreichung tatsächlich durchgeführt und dokumentiert.
- [ ] Google-Reviewstatus beobachtet; Einreichung nicht als Freigabe bezeichnet.
- [ ] Öffentlicher Store-Link erreicht den richtigen Eintrag.
- [ ] Ausgelieferte Version installiert und Kernablauf geprüft.
- [ ] Kauf und Wiederherstellung der ausgelieferten Fassung überprüft.
- [ ] Support- und Korrekturablauf dokumentiert.

Fehlende externe Zugänge, Tester oder Review-Ergebnisse werden als blocked_external geführt. Alle davon unabhängigen Aufgaben werden abgeschlossen. Der letzte Bericht nennt präzise, welcher Fertigstellungszustand erreicht wurde.

Ein Release mit ungeprüften Käufen, 150 statt 1.200 Fragen oder bloß simulierten Zielgruppentests erfüllt diese V1-Spezifikation nicht. Der Agent darf den Umfang nicht still herabsetzen. Eine bewusst kleinere Veröffentlichung wäre eine ausdrücklich dokumentierte Produktänderung.

