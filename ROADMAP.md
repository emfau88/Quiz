# Quizsalon · Roadmap und Nachweise

## 0.4.0 · Weiterspielen, Quiztisch und Freundesrunden

Die HTML-App bietet unbegrenzte kostenlose Fünferrunden, drei wählbare Unterthemen, wechselnde Computergegner mit Revanche und Freundeslinks. Der Upgrade-Test wurde mit einem begonnenen 0.3.0-Spielstand in Einzel-HTML, installierter Browserfassung und Android-App durchgeführt. Den Stand je Arbeitspaket zeigen die verknüpften Abnahmen. [Plan und Belege](UMSETZUNGSPLAN_WEITERSPIELEN.md) · [Prüfbericht](QA_REPORT.md)

## Fragenpool 0.3.0

Die aktuelle Erweiterung umfasst den verdoppelten deutschen Fragenbestand, zwei feste Hinweisfragen und eine Schätzfrage pro neuer Tagesrunde sowie datierte Forschung mit Originalquellen. Alle sechs Arbeitspakete der Ausgabe 0.3.0 sind belegt. Der aktualisierte Spieleinstieg ist über GitHub Pages erreichbar. [Öffentlicher Spieldurchlauf](release/qa/modern-0.3.0/github-pages-live.json) [Stand der Erweiterung](UMSETZUNGSPLAN_FRAGENPOOL.md)

## Fragenpool 0.2.0

Die sechs deutschen Kategorien enthalten zusammen 152 neue Sachverhalte. Alle 150 Referenzfragen sind weiter aktiv. Die veränderte Auswahl ist mit dem alten Algorithmus auf altem und neuem Bestand verglichen. Die einzelnen Arbeitspakete und Abnahmen werden im fortgeführten Fragenpoolplan abgehakt. Englisch ist dort als eigenes späteres Paket geführt. [Arbeitspakete mit Checkboxen](UMSETZUNGSPLAN_FRAGENPOOL.md) · [Inhaltsabgleich](release/qa/fragenpool/inhaltsabgleich.json) · [Auswahlmessung](release/qa/fragenpool/auswahlvergleich.json)

## Aufbau der Grundversion

Die deutsche Browser-Testausgabe ist über GitHub Pages erreichbar. Die Phasen 10 und 11 unten betreffen die Veröffentlichung der Android-App bei Google Play. [Browser-Testausgabe](https://emfau88.github.io/Quiz/spielen.html?v=0.4.0) · [Prüfnachweis](QA_REPORT.md)

| Phase | Aufgabe | Status | Nachweis oder externe Abhängigkeit |
| --- | --- | --- | --- |
| 0 | Repository prüfen, Produktregeln und Architektur festhalten | done | Fünf Markdown-Anhänge, kein vorhandener Code und keine AGENTS.md. Regeln aus dem vorliegenden Text rekonstruiert. Siehe DECISIONS.md und specs/. |
| 1 | Erster vollständiger Durchlauf | done | 24 belegte Fragen, Starter-APK und reale Screenshots unter release/android/ und release/screenshots/starter/. |
| 2 | 150 Referenzfragen und ausführbarer Katalogcompiler | done | 25 pro Kategorie, Mischung 15/7/3. Referenz-Commit 2675459, release/qa/katalog-referenz.json und release/screenshots/referenz/pruefung.json. |
| 3 | Tagesauswahl, lokale Transaktionen, Wiederaufnahme | done | Node- und Browserprüfungen, echte App-Prozessabbrüche, SQLite und IndexedDB. Update über den Referenzstand in release/android/qa-upgrade/android-ui.json. |
| 4 | Fortschritt, Kalender, Album und Inhaltskorrektur | done | Ledger und Wochenziel, vorbereiteter echter Spielstand, neutralisierte offene Position und historisches Ergebnis in release/screenshots/sonderfaelle/. |
| 5 | Themen, Proben und Computergegner | done | Reguläre Vorschau und isolierte Lokaltestausgabe. Vollständige kostenlose und anspruchsvolle Runden sowie vorab gespeicherte Computerergebnisse geprüft. |
| 6 | 600 und anschließend 1.200 geprüfte Fragen | done | release/qa/katalog-600.json, web/data/manifest.json, CONTENT_REPORT.md und redaktionelle Einzelprotokolle. |
| 7a | Play-Integration, Backup und Erinnerungen implementieren | done | Native Bibliothek 8.0.0, Belegprüfung, geschützter Kaufcache, System-Restore und Android-Berechtigungsdialog. Siehe android/ und release/android/qa-plattform/. |
| 7b | Tatsächliche Play-Lizenzkäufe und Wiederherstellung | blocked_external | Endgültiges Play-Projekt, echtes Produkt, Lizenztester und signierter interner Track fehlen. |
| 8a | Browser und Android-Emulatoren prüfen | done | QA_REPORT.md, 3.600 Fragenlayouts, Android 14 und 16, 16-KB-Seitengröße und eine vollständige über Google TalkBack bediente Tagesrunde. |
| 8b | Physisches Smartphone und Zielgruppe | blocked_external | Echtes Nutzergerät und freiwillige Teilnehmende stehen aus. Erprobungsbogen in docs/ERPROBUNG.md. |
| 9a | Lokale Übergabe, Store-Texte und Bildmaterial | done | Selbständige HTML-Datei, zwei finale APKs, sechs originale Telefonaufnahmen, Icon, Feature Graphic und lokale Datenschutzunterlagen unter release/. |
| 9b | Betreiberfreigabe, öffentlicher Datenschutzlink und Release-AAB | blocked_external | Endgültige Betreiberangaben, Paketname und autorisierte Upload-Signierung stehen aus. |
| 10 | Über öffentliche Veröffentlichung entscheiden und ggf. einreichen | blocked_external | Der Auftraggeber entscheidet nach seinem lokalen Test. Keine Einreichung erfolgt. |
| 11 | Öffentlichen Stand und tatsächliche Auslieferung prüfen | blocked_external | Nach erfolgter Veröffentlichung möglich. |
