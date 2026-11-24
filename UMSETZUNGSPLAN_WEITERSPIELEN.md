# Quizsalon · Umsetzungsplan für Weiterspielen, Quiztisch und Freundesrunden

Umsetzungsstand 24. November 2026 · Deutsche HTML-Ausgabe 0.4.0 auf Basis des 2.400-Fragen-Katalogs aus 0.3.0. Jeder Haken gehört zum verknüpften Prüfnachweis.

## Das Spielerlebnis

Nach „7 von 10 richtig“ kann ich mit **„Noch 5 Fragen“** sofort kostenlos weiterspielen oder über **„Thema wählen“** ein Gebiet aussuchen. Am optionalen Quiztisch erkenne ich die drei Computergegner schon vor meiner ersten Antwort. Ich kann mit denselben Figuren eine Revanche spielen. Nach einer gemischten Fünferrunde kann ich einem echten Freund **„Schaffst du meine 4 von 5?“** schicken. Er bekommt dieselben Fragen und kann mir sein Ergebnis zurückschicken.

In 0.3.0 führte die Hauptaktion am Ergebnis zur Übersicht. In 0.4.0 stehen die nächste Kurzrunde und die Themenwahl direkt am Ergebnis. Das reguläre Modell behält die sechs kostenlosen Kennenlernrunden und den Plus-Einmalkauf. [Ergebnis und Themenansicht](web/js/views.js) · [Spielregeln](specs/product_rules.json) · [Öffentliche Testausgabe](https://emfau88.github.io/Quiz/spielen.html?v=0.4.0)

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

- [x] Einen eigenen Modus für fünf gemischte Fragen aus dem gesamten freigegebenen Katalog ergänzen. Möglichst viele Kategorien, bevorzugt ungesehene Fragen und fünf verschiedene Sachverhalte wählen. Solange Alternativen vorhanden sind, die unmittelbar vorherige Fünferrunde aussparen.
- [x] Den Start für kostenlose und zahlende Spieler öffnen. Neben der Tagesrunde kann jeweils eine Zusatzrunde offen sein. Bei einem Konflikt die offene Runde zum Fortsetzen anbieten. Zum Aufgeben ist eine bewusste Auswahl erforderlich.
- [x] Auswahl, Antwortreihenfolge und Fortsetzung im bestehenden Rundenspeicher ablegen. Doppeltipp und gleichzeitiger Start aus zwei Tabs führen zur selben neuen Runde. Antwort und Lernbuchung gemeinsam speichern. [Auswahl und Fortschritt](web/js/engine.js) · [Speicherung](web/js/storage.js)
- [x] **Zur Abnahme** in der regulären Ausgabe ohne Plus drei Fünferrunden direkt nacheinander spielen, eine nach Antwort zwei offline fortsetzen. Ergebnis und Album prüfen. Tagesbuchungen, Wochenziel, verbrauchte Themenproben und Kaufstatus vor und nach den Zusatzrunden vergleichen.

Nachweis für Bulk 1. Drei reguläre Kurzrunden ergaben 15 verschiedene neue Albumkarten. Zwei Tabs starteten dieselbe Zusatzrunde. Nach Antwort zwei kam das Gerät am Folgetag ohne Netz in dieselbe Erklärung zurück. [Browsernachweis mit Wertung vor und nach den Runden](release/qa/weiterspielen-0.4.0/kostenlose-kurzrunden.json) · [Antwort und Lernbuchung bei Transaktionsabbruch](release/qa/weiterspielen-0.4.0/speicherung/pruefung.json)

## Bulk 2 · Vom Ergebnis direkt weiterspielen

- [x] Nach einer abgeschlossenen Runde **„Noch 5 Fragen“** als Hauptaktion und **„Thema wählen“** daneben oder darunter anbieten. „Zur Übersicht“ bleibt als einfache Ausstiegsmöglichkeit erreichbar. Auf „Heute“ die Kurzrunde auch vor der Tagesrunde und nach einem späteren Neustart zugänglich machen.
- [x] Beim ersten Start weiterhin direkt Frage eins anzeigen. Ein einzelner Hinweis darf die nächste tatsächlich erreichbare Wochenetappe erklären, etwa „Noch ein Spieltag bis zum Wochenziel“, wenn drei von vier Tagen erreicht sind.
- [x] **Zur Abnahme** mit einem Antippen vom Tagesergebnis zur ersten Frage der Kurzrunde gelangen. Den Weg vom Kurzrundenergebnis wiederholen und über „Thema wählen“ ins richtige Angebot gelangen. Beide Pfade auf kleinem Handy als Screenshots belegen.

Nachweis für Bulk 2. Die Wege vom Tages- und Kurzrundenergebnis sowie die Themenwahl sind bei 360 CSS-Pixeln durchgespielt. Der Wochenhinweis ist für zwei, drei und vier Spieltage und am Wochenende geprüft. [Tagesergebnis](release/qa/weiterspielen-0.4.0/ui/02-Tagesergebnis.png) · [Nächste Kurzrunde](release/qa/weiterspielen-0.4.0/ui/03-Kostenlose-Kurzrunde.png) · [Themenwahl](release/qa/weiterspielen-0.4.0/ui/06-Thema-waehlen.png) · [Regeltests](release/qa/weiterspielen-0.4.0/regeltests.json)

## Bulk 3 · Themen, die Spieler wirklich wählen können

- [x] Die sechs Hauptkategorien als Einstieg verwenden. Für den ersten Ausbau drei Unterthemen aus vorhandenen Karten erschließen. „Filmgeschichte“ bündelt zwei redaktionelle Schlagwörter mit insgesamt 96 Karten. „Tierverhalten“ hat 38 und „Wetter“ 30 Karten. Die Zuordnung wird im Katalogbau nach Kategorie und Sachverhalt geprüft. [Ausgangskatalog](web/data/catalog.json)
- [x] Jede angebotene Mischung mit den tatsächlich verfügbaren Karten prüfen. Gemischt zielt auf 6 leichte, 3 mittlere und 1 anspruchsvolle Frage. Anspruchsvoll benötigt 2 leichte, 5 mittlere und 3 anspruchsvolle. „Tierverhalten“ hat aktuell nur 2 anspruchsvolle Karten. Dort „Gemischt“ sowie die anspruchsvolle Hauptrubrik „Natur und Tiere“ anbieten. Reservierte oder zurückgezogene Karten bei der Verfügbarkeit berücksichtigen.
- [x] Vor dem Start Länge, Schwierigkeit und Zugang anzeigen. Die sechs Kennenlernrunden gelten für Hauptkategorien. Die reguläre App verwendet für freie Themenwahl die bestehende Plus-Berechtigung. Die Web-Testausgabe darf alle Themen zum Ausprobieren anbieten. [Zugangsprüfung](web/js/access.js) · [Themenauswahl](web/js/app.js)
- [x] **Zur Abnahme** die drei Unterthemen über die sichtbare Oberfläche öffnen. Jede angebotene Variante bis zum Ergebnis spielen und ihre zehn Karten auf Themenzugehörigkeit prüfen. Verbrauchte Probe, fehlendes Plus, gültiges Plus und eine durch offene Runden verknappte Auswahl abdecken.

Nachweis für Bulk 3. Fünf unterschiedliche Unterthemenrunden und die Ausweichrunde Natur wurden bis zur letzten Antwort gespielt. Der Bericht enthält jede gewählte Karte, die Schwierigkeitsmischung, die Wetter-Reservierung, Probenverbrauch und getrennt geprüfte Kaufstatus. [Abnahme der Themen](release/qa/weiterspielen-0.4.0/themen.json) · [Katalogzahlen](web/data/manifest.json)

## Bulk 4 · Wechselnder Quiztisch und Revanche

- [x] Als Startgröße zwölf illustrierte Salonfiguren mit beständiger Kennung, Vornamen und Fachgebieten vorsehen. Ada, Oskar und Mira gehören dazu. Für Tages- und Kurzrunden jeweils drei verschiedene Figuren auswählen. Bei einem neuen Tisch wechselt mindestens eine Figur. Wiederkehrende Gäste bleiben erkennbar.
- [x] Den Tisch kompakt bei Frage eins vorstellen, ohne zusätzlichen Startdialog. Eine gut lesbare gemeinsame Zeile lautet **„Heute am Tisch mit drei Computergegnern“**. Bei den Figuren stehen Vorname und Stärke, im Ergebnis die Treffer. Die Tabelle bekommt dieselbe eindeutige Bezeichnung für TalkBack. Der bestehende Schalter blendet den ganzen Computervergleich einschließlich Revanche aus.
- [x] Besetzung und Treffer beim Rundenstart je Frage anhand von Schwierigkeit und Fachgebiet speichern. **„Revanche mit diesem Tisch“** startet eine kostenlose gemischte Fünferrunde mit derselben Besetzung und frisch gewählten Fragen. Gleichstände teilen einen Platz. Ein Vergleich setzt zehn gültige Tagesfragen oder fünf gültige Kurzfragen voraus. [Heutige Simulation und Rangfolge](web/js/engine.js) · [Produktregel zur Kennzeichnung](docs/QUIZSALON_UMSETZUNGSPLAN.md)
- [x] **Zur Abnahme** wechselnde Besetzungen, identisches Trio bei Revanche, stabilen Spielstand nach Pause und Update, geteilte Plätze und ausgeschalteten Vergleich nachweisen. Bei nachträglich korrigierten Fragen die persönliche Auswertung mit Korrekturhinweis anzeigen. In offenen 0.3.0-Runden die Figuren und Treffer mit dem Spielstand vor dem Update vergleichen.

Nachweis für Bulk 4. In 40 aufeinanderfolgenden neuen Kurzrunden kamen alle zwölf Gäste vor. Der Regeltest prüft geteilte Plätze, Revanche und Korrekturen. Der Android-Updatebeleg vergleicht alle 30 gespeicherten Einzeltreffer des alten Tisches. [Regeltests](release/qa/weiterspielen-0.4.0/regeltests.json) · [Quiztisch im Spiel](release/qa/weiterspielen-0.4.0/ui/01-Quiztisch.png) · [Android-Update](release/qa/weiterspielen-0.4.0/android-update/android-ui.json)

## Bulk 5 · Fünf identische Fragen für echte Freunde

- [x] Am Ergebnis einer vollständig gültigen gemischten Fünferrunde oder Revanche **„Freunde herausfordern“** anbieten. Der Absender teilt freiwillig seinen Trefferwert. Der Empfänger sieht die Einladung, spielt kostenlos, vergleicht danach beide Ergebnisse und kann sein Ergebnis über das Teilen-Menü als Text zurücksenden.
- [x] Einen öffentlichen HTTPS-Spiel-Link mit eigener Route im URL-Fragment vorsehen. Er enthält ausschließlich Formatversion, fünf geordnete Fragekennungen mit Inhalts- und Bedeutungsrevision, die Antwortreihenfolgen sowie den geteilten Trefferwert von 0 bis 5. Der Empfänger übernimmt diese Auswahl aus dem Link. Der Trefferwert ist eine freiwillige Angabe des Absenders. Die Freundesrunde erhält eine eigene Moduskennung, denn `challenge` bezeichnet im bestehenden Code die anspruchsvolle Plus-Themenrunde.
- [x] Einladung vor dem normalen Erststart auswerten. Nur gültige, eindeutige und verfügbare Karten der passenden Revision starten. Ein neuer Gesamtkatalog ist kompatibel, wenn alle fünf Kartenfassungen passen. Bei veralteten oder fehlerhaften Links eine Erklärung und eine gewöhnliche Kurzrunde anbieten. Reserviert eine offene Tagesrunde eine der fünf Karten, zuerst deren Fortsetzung anbieten. Erneutes Öffnen derselben Einladung führt zum gespeicherten Stand oder Ergebnis. Eine während des Spiels zurückgezogene Frage beendet die Vergleichbarkeit.
- [x] Browser und native Android-Ausgabe nutzen auf ausdrückliches Antippen das Systemmenü. Als Alternative steht der kopierbare öffentliche Link bereit, auch in der lokalen HTML-Datei. Der Link öffnet die Browserfassung. Ein frisches Empfängergerät benötigt Internet für den ersten Abruf. Danach kann die geladene Runde offline beendet werden. [Router und Startlogik](web/js/app.js) · [Pages-Einstieg](tools/package-web.mjs) · [Web Share](https://www.w3.org/TR/web-share/) · [Android-Teilen](https://developer.android.com/training/sharing/send)
- [x] **Zur Abnahme** zwei getrennte Profile mit unterschiedlichem Lernstand und Tagesdatum verwenden. A teilt ein tatsächlich erspieltes 4/5, B erhält exakt dieselben Fragen und Antwortreihenfolgen und erzielt ein eigenes Ergebnis. Wiederöffnen, Abbruch des Teilen-Menüs, Kopieren, Offline-Fortsetzung, Katalogwechsel und beschädigten Link prüfen. Bei der Einladungsansicht müssen Lernstand und Kaufstatus mit den Werten vor dem Öffnen übereinstimmen.

Nachweis für Bulk 5. Zwei getrennte Profile spielten 4/5 gegen 3/5. Der Bericht enthält die Kartenrevisionen, die tatsächlich angezeigte Antwortreihenfolge und die Offline-Fortsetzung. Der Browser-Test deckt den kontrollierten Abbruch des Teilen-Menüs ab. Android öffnete das echte Systemmenü. [Zwei-Profile-Test](release/qa/weiterspielen-0.4.0/freunde-lokal/freundesrunde.json) · [Gesamter Bedienweg](release/qa/weiterspielen-0.4.0/ui/weiter-ui.json) · [Android-Teilen-Menü](release/qa/weiterspielen-0.4.0/android-freie-runden/systemmenue.png)

## Bulk 6 · Gemeinsame Abnahme und Übergabe

- [x] Einen begonnenen 0.3.0-Spielstand in Einzel-HTML, öffentlicher Browserfassung und Android-App aktualisieren. Antworten, Tageswertung, Vergleich und verbrauchte Proben prüfen. Neue Zusatzrunden müssen nach Tageswechsel fortsetzbar sein. [Bestehende Update- und Speichertests](tests/)
- [x] Ergebnisaktionen, gemeinsame Bezeichnung „Computergegner“, Themenwahl und Einladungen bei 200 Prozent Browserschrift sowie mit Google TalkBack und 150 Prozent Systemschrift durchlaufen. Auf 360 dp wurden alle fünf Antworten einzeln per Geste bestätigt, beide Ergebnisaktionen fokussiert und Wetter über die Themenwahl erreicht. [Browserprüfung](release/qa/weiterspielen-0.4.0/ui/weiter-ui.json) · [Android-Gestenprotokoll](release/qa/weiterspielen-0.4.0/android-talkback/talkback.txt)
- [x] Kostenlose Wege, gültiges Plus und Entzug einer Berechtigung in der regulären Ausgabe prüfen. Nach Entzug lassen sich neue kostenlose Kurzrunden starten. Für neue Plus-Themenrunden greift die Kaufprüfung. Die acht isolierten Statusfälle und die lokale signierte Geräteprüfung sind belegt. [Externe Abhängigkeiten](BLOCKERS.md)
- [x] Die Belege je Bulk verlinken, HTML und Test-APKs aus demselben Katalog bauen und den GitHub-README-Link mit zwei getrennten Browserprofilen bis zur Freundesauswertung prüfen. [Öffentlicher Zwei-Profile-Test](release/qa/weiterspielen-0.4.0/github-pages-live/freundesrunde.json) · [GitHub Actions](https://github.com/emfau88/Quiz/actions/runs/45485316109) · [Release-Checkliste](RELEASE_CHECKLIST.md)

## Spätere Freigabe bei Google Play

- [ ] Einen echten Kauf im internen Play-Track tätigen, den erworbenen Zugang wiederherstellen und nach einem Offline-Neustart nachweisen. Der Betreiber entscheidet über die Veröffentlichung nach seinem lokalen Test. [Externe Abhängigkeiten](BLOCKERS.md)
