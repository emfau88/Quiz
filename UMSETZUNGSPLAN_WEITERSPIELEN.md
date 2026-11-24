# Quizsalon · Umsetzungsplan für Weiterspielen, Quiztisch und Freundesrunden

Planstand 24. November 2026 · Grundlage ist die deutsche HTML-Ausgabe 0.3.0 mit 2.400 Fragen. Die Arbeitspakete sind offen. Ein Häkchen erhält erst der Punkt, dessen Verhalten im angegebenen Prüfbeleg nachvollziehbar ist.

## Das geplante Spielerlebnis

Nach „7 von 10 richtig“ kann ich mit **„Noch 5 Fragen“** sofort kostenlos weiterspielen oder über **„Thema wählen“** ein Gebiet aussuchen. Am optionalen Quiztisch erkenne ich die drei Computergegner schon vor meiner ersten Antwort. Ich kann mit denselben Figuren eine Revanche spielen. Nach einer gemischten Fünferrunde kann ich einem echten Freund **„Schaffst du meine 4 von 5?“** schicken. Er bekommt dieselben Fragen und kann mir sein Ergebnis zurückschicken.

In 0.3.0 führt die Hauptaktion am Ergebnis zur Übersicht. Der Testlink erlaubt heute schon weitere Themenrunden. Das reguläre Modell umfasst sechs kostenlose Kennenlernrunden und einen Plus-Einmalkauf. Die drei bisherigen Computerfiguren haben bereits unterschiedliche Stärken und gespeicherte Treffer. Auf diesen Funktionen baut der Plan auf. [Ergebnis und Themenansicht](web/js/views.js) · [Spielregeln](specs/product_rules.json) · [Öffentliche Testausgabe](https://emfau88.github.io/Quiz/spielen.html?v=0.3.0)

| Vorbild | Was Quizsalon daraus übernimmt |
| --- | --- |
| Quizduell gibt über mehrere Duelle und wechselnde Kategorien einen Anlass zur Rückkehr. | Wiederkehrende Tischgäste, eine freiwillige Revanche und ein zeitversetzter Vergleich mit einem echten Freund. [Quizduell bei MAG](https://www.maginteractive.com/games/quizduel/) |
| Trivia Crack lässt Spieler ihr Spezialthema wählen und darin weiterspielen. | Eine kostenlose gemischte Anschlussrunde und verständlich benannte Unterthemen zur gezielten Auswahl mit Plus. [Themenmodus bei Etermax](https://triviacrack.help.etermax.com/hc/en-us/articles/360033522154-Topics) |
| Das Millionär-Spiel macht die nächste erreichbare Stufe innerhalb und zwischen Partien sichtbar. | Am Ergebnis stehen die nächste spielbare Runde und bei passendem Fortschritt ein konkreter Hinweis auf das bestehende Wochenziel. [Spielbeschreibung von Sony](https://www.sonypictures.com/games/whowantstobeamillionaire) |

## Zugang und Wertung

| Angebot | Zugang und Länge | Was zählt |
| --- | --- | --- |
| Tagesrunde | Kostenlos, einmal je lokalem Tagesdatum, 10 Fragen | Einzige Runde für Tages-XP und Wochenziel. Eine Schätzung, zwei Hinweisfragen und höchstens zwei reine Wissensabfragen. |
| „Noch 5 Fragen“ und Revanche | Kostenlos, beliebig oft, 5 gemischte Fragen | Eigene Antworten zählen für Lernen und Wissensalbum. |
| Kennenlernrunde | Kostenlos, einmal je Hauptkategorie, 5 Fragen | Eigene Antworten zählen für Lernen und Wissensalbum. |
| Freie Themenwahl | Plus als Einmalkauf, 10 Fragen. Hauptkategorie oder verfügbares Unterthema, gemischt oder anspruchsvoll. | Eigene Antworten zählen für Lernen und Wissensalbum. |
| Freundesrunde | Kostenlose Einladung aus einer abgeschlossenen gemischten Fünferrunde oder Revanche | Der Empfänger spielt selbst. Nur seine eigenen Antworten gehen in seinen Lernstand ein. |

Die Finanzierung erfolgt über den einmaligen Plus-Kauf. Für kostenlose und gekaufte Runden gelten dieselben Lernregeln. Spielstände liegen auf dem jeweiligen Gerät.

## Bulk 1 · Kostenlose Fünferrunde und Spielstand

- [ ] Einen eigenen Modus für fünf gemischte Fragen aus dem gesamten freigegebenen Katalog ergänzen. Möglichst viele Kategorien, bevorzugt ungesehene Fragen und fünf verschiedene Sachverhalte wählen. Solange Alternativen vorhanden sind, die unmittelbar vorherige Fünferrunde aussparen.
- [ ] Den Start für kostenlose und zahlende Spieler öffnen. Neben der Tagesrunde kann jeweils eine Zusatzrunde offen sein. Bei einem Konflikt die offene Runde zum Fortsetzen anbieten. Zum Aufgeben ist eine bewusste Auswahl erforderlich.
- [ ] Auswahl, Antwortreihenfolge und Fortsetzung im bestehenden Rundenspeicher ablegen. Doppeltipp und gleichzeitiger Start aus zwei Tabs führen zur selben neuen Runde. Antwort und Lernbuchung gemeinsam speichern. [Auswahl und Fortschritt](web/js/engine.js) · [Speicherung](web/js/storage.js)
- [ ] **Zur Abnahme** in der regulären Ausgabe ohne Plus drei Fünferrunden direkt nacheinander spielen, eine nach Antwort zwei offline fortsetzen. Ergebnis und Album prüfen. Tagesbuchungen, Wochenziel, verbrauchte Themenproben und Kaufstatus vor und nach den Zusatzrunden vergleichen.

## Bulk 2 · Vom Ergebnis direkt weiterspielen

- [ ] Nach einer abgeschlossenen Runde **„Noch 5 Fragen“** als Hauptaktion und **„Thema wählen“** daneben oder darunter anbieten. „Zur Übersicht“ bleibt als einfache Ausstiegsmöglichkeit erreichbar. Auf „Heute“ die Kurzrunde auch vor der Tagesrunde und nach einem späteren Neustart zugänglich machen.
- [ ] Beim ersten Start weiterhin direkt Frage eins anzeigen. Ein einzelner Hinweis darf die nächste tatsächlich erreichbare Wochenetappe erklären, etwa „Noch ein Spieltag bis zum Wochenziel“, wenn drei von vier Tagen erreicht sind.
- [ ] **Zur Abnahme** mit einem Antippen vom Tagesergebnis zur ersten Frage der Kurzrunde gelangen. Den Weg vom Kurzrundenergebnis wiederholen und über „Thema wählen“ ins richtige Angebot gelangen. Beide Pfade auf kleinem Handy als Screenshots belegen.

## Bulk 3 · Themen, die Spieler wirklich wählen können

- [ ] Die sechs Hauptkategorien als Einstieg verwenden. Für den ersten Ausbau drei Unterthemen aus vorhandenen Karten erschließen. „Filmgeschichte“ bündelt zwei redaktionelle Schlagwörter mit insgesamt 96 Karten. „Tierverhalten“ hat 38 und „Wetter“ 30 Karten. Die Zuordnung wird im Katalogbau nach Kategorie und Sachverhalt geprüft. [Ausgangskatalog](web/data/catalog.json)
- [ ] Jede angebotene Mischung mit den tatsächlich verfügbaren Karten prüfen. Gemischt zielt auf 6 leichte, 3 mittlere und 1 anspruchsvolle Frage. Anspruchsvoll benötigt 2 leichte, 5 mittlere und 3 anspruchsvolle. „Tierverhalten“ hat aktuell nur 2 anspruchsvolle Karten. Dort „Gemischt“ sowie die anspruchsvolle Hauptrubrik „Natur und Tiere“ anbieten. Reservierte oder zurückgezogene Karten bei der Verfügbarkeit berücksichtigen.
- [ ] Vor dem Start Länge, Schwierigkeit und Zugang anzeigen. Die sechs Kennenlernrunden gelten für Hauptkategorien. Die reguläre App verwendet für freie Themenwahl die bestehende Plus-Berechtigung. Die Web-Testausgabe darf alle Themen zum Ausprobieren anbieten. [Zugangsprüfung](web/js/access.js) · [Themenauswahl](web/js/app.js)
- [ ] **Zur Abnahme** die drei Unterthemen über die sichtbare Oberfläche öffnen. Jede angebotene Variante bis zum Ergebnis spielen und ihre zehn Karten auf Themenzugehörigkeit prüfen. Verbrauchte Probe, fehlendes Plus, gültiges Plus und eine durch offene Runden verknappte Auswahl abdecken.

## Bulk 4 · Wechselnder Quiztisch und Revanche

- [ ] Als Startgröße zwölf illustrierte Salonfiguren mit beständiger Kennung, Vornamen und Fachgebieten vorsehen. Ada, Oskar und Mira gehören dazu. Für Tages- und Kurzrunden jeweils drei verschiedene Figuren auswählen. Bei einem neuen Tisch wechselt mindestens eine Figur. Wiederkehrende Gäste bleiben erkennbar.
- [ ] Den Tisch kompakt bei Frage eins vorstellen, ohne zusätzlichen Startdialog. Eine gut lesbare gemeinsame Zeile lautet **„Heute am Tisch mit drei Computergegnern“**. Bei den Figuren stehen Vorname und Stärke, im Ergebnis die Treffer. Die Tabelle bekommt dieselbe eindeutige Bezeichnung für TalkBack. Der bestehende Schalter blendet den ganzen Computervergleich einschließlich Revanche aus.
- [ ] Besetzung und Treffer beim Rundenstart je Frage anhand von Schwierigkeit und Fachgebiet speichern. **„Revanche mit diesem Tisch“** startet eine kostenlose gemischte Fünferrunde mit derselben Besetzung und frisch gewählten Fragen. Gleichstände teilen einen Platz. Ein Vergleich setzt zehn gültige Tagesfragen oder fünf gültige Kurzfragen voraus. [Heutige Simulation und Rangfolge](web/js/engine.js) · [Produktregel zur Kennzeichnung](docs/QUIZSALON_UMSETZUNGSPLAN.md)
- [ ] **Zur Abnahme** wechselnde Besetzungen, identisches Trio bei Revanche, stabilen Spielstand nach Pause und Update, geteilte Plätze und ausgeschalteten Vergleich nachweisen. Bei nachträglich korrigierten Fragen die persönliche Auswertung mit Korrekturhinweis anzeigen. In offenen 0.3.0-Runden die Figuren und Treffer mit dem Spielstand vor dem Update vergleichen.

## Bulk 5 · Fünf identische Fragen für echte Freunde

- [ ] Am Ergebnis einer vollständig gültigen gemischten Fünferrunde oder Revanche **„Freunde herausfordern“** anbieten. Der Absender teilt freiwillig seinen Trefferwert. Der Empfänger sieht die Einladung, spielt kostenlos, vergleicht danach beide Ergebnisse und kann sein Ergebnis über das Teilen-Menü als Text zurücksenden.
- [ ] Einen öffentlichen HTTPS-Spiel-Link mit eigener Route im URL-Fragment vorsehen. Er enthält ausschließlich Formatversion, fünf geordnete Fragekennungen mit Inhalts- und Bedeutungsrevision, die Antwortreihenfolgen sowie den geteilten Trefferwert von 0 bis 5. Der Empfänger übernimmt diese Auswahl aus dem Link. Der Trefferwert ist eine freiwillige Angabe des Absenders. Die Freundesrunde erhält eine eigene Moduskennung, denn `challenge` bezeichnet im bestehenden Code die anspruchsvolle Plus-Themenrunde.
- [ ] Einladung vor dem normalen Erststart auswerten. Nur gültige, eindeutige und verfügbare Karten der passenden Revision starten. Ein neuer Gesamtkatalog ist kompatibel, wenn alle fünf Kartenfassungen passen. Bei veralteten oder fehlerhaften Links eine Erklärung und eine gewöhnliche Kurzrunde anbieten. Reserviert eine offene Tagesrunde eine der fünf Karten, zuerst deren Fortsetzung anbieten. Erneutes Öffnen derselben Einladung führt zum gespeicherten Stand oder Ergebnis. Eine während des Spiels zurückgezogene Frage beendet die Vergleichbarkeit.
- [ ] Browser und native Android-Ausgabe nutzen auf ausdrückliches Antippen das Systemmenü. Als Alternative steht der kopierbare öffentliche Link bereit, auch in der lokalen HTML-Datei. Der Link öffnet die Browserfassung. Ein frisches Empfängergerät benötigt Internet für den ersten Abruf. Danach kann die geladene Runde offline beendet werden. [Router und Startlogik](web/js/app.js) · [Pages-Einstieg](tools/package-web.mjs) · [Web Share](https://www.w3.org/TR/web-share/) · [Android-Teilen](https://developer.android.com/training/sharing/send)
- [ ] **Zur Abnahme** zwei getrennte Profile mit unterschiedlichem Lernstand und Tagesdatum verwenden. A teilt ein tatsächlich erspieltes 4/5, B erhält exakt dieselben Fragen und Antwortreihenfolgen und erzielt ein eigenes Ergebnis. Wiederöffnen, Abbruch des Teilen-Menüs, Kopieren, Offline-Fortsetzung, Katalogwechsel und beschädigten Link prüfen. Bei der Einladungsansicht müssen Lernstand und Kaufstatus mit den Werten vor dem Öffnen übereinstimmen.

## Bulk 6 · Gemeinsame Abnahme und Übergabe

- [ ] Einen begonnenen 0.3.0-Spielstand in Einzel-HTML, öffentlicher Browserfassung und Android-App aktualisieren. Antworten, Tageswertung, Vergleich und verbrauchte Proben prüfen. Neue Zusatzrunden müssen nach Tageswechsel fortsetzbar sein. [Bestehende Update- und Speichertests](tests/)
- [ ] Ergebnisaktionen, Ansage „Computergegner“, Themenwahl und Einladungen im kleinen Handyformat mit 200 Prozent Browserschrift sowie auf Android mit TalkBack und 150 Prozent Systemschrift durchlaufen. Sichtbare Beschriftung, Fokus und Bedienung bis zum Ergebnis belegen.
- [ ] Kostenlose Wege, gültiges Plus und Entzug einer Berechtigung in der regulären Ausgabe prüfen. Nach Entzug lassen sich neue kostenlose Kurzrunden starten. Für neue Plus-Themenrunden greift die Kaufprüfung. Für einen echten Google-Play-Kauf, seine Wiederherstellung und die Offline-Berechtigung gelten die dokumentierten Play-Voraussetzungen. [Externe Abhängigkeiten](BLOCKERS.md)
- [ ] Bei Umsetzungsauftrag die Belege je Bulk verlinken, HTML und Test-APKs aus demselben Katalog bauen und den GitHub-README-Link mit zwei getrennten Browserprofilen bis zur Freundesauswertung prüfen. Prüfreport und Release-Checkliste erhalten tatsächlich beobachtete Ergebnisse. Eine spätere Store-Freigabe bleibt eine Betreiberentscheidung.

**Reihenfolge.** Bulk 1 liefert die gemeinsame Grundlage. Danach können Ergebnisansicht (2), Themenredaktion und Zugang (3), Quiztisch (4) sowie Einladungsformat (5) parallel entstehen. Revanche und Teilen werden in die fertige Ergebnisansicht integriert. Der erste spielbare Meilenstein ist „Tagesrunde → Noch 5 Fragen → Noch 5 Fragen“. Der zweite ergänzt Themenwahl und Revanche. Der dritte ist das vollständige Freundesduell über den Spiel-Link. Bulk 6 prüft alle drei zusammen.
