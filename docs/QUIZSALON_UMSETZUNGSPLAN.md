# Quizsalon Umsetzungsplan bis zur veröffentlichten Android App

Version 1.0 · Stand 20. November 2026

Dieses Pflichtenheft richtet sich an einen Coding-Agenten. Er soll eine tatsächlich spielbare, geprüfte und veröffentlichungsfähige Android-App umsetzen. Die Produktentscheidungen sind verbindliche Defaults. Der Agent setzt die Phasen nacheinander um, erledigt unabhängige Arbeiten parallel und hält externe Abhängigkeiten sichtbar. Er beendet die Arbeit nicht nach einem Konzept, einer Oberfläche mit Attrappen oder einem ersten erfolgreichen Build.

Quizsalon ist ein Arbeitstitel. Der Paketname, reale Betreiberangaben und der öffentliche Auftritt werden vor der ersten Store-Einrichtung mit den tatsächlich verfügbaren Angaben festgelegt. Diese Unterlagen enthalten einen Bauauftrag und Prüfkriterien, noch keine implementierte App oder erfolgten Tests.

## 1 Ziel und Umfang

Entwickle ein deutschsprachiges Tagesquiz für quizinteressierte Erwachsene, zunächst mit Gestaltungsschwerpunkt auf Menschen von ungefähr 50 bis 70 Jahren. Die App soll leicht zu bedienen sein, erwachsen aussehen und das eigene Wissen sowie tatsächlich erlebtes Wiederlernen angenehm sichtbar machen.

Eine normale Tagesrunde besteht aus zehn Fragen und dauert als Gestaltungsziel ungefähr fünf bis sieben Minuten. Vier Antworten stehen untereinander. Es gibt keinen Countdown und keinen Tempobonus. Nach jeder Antwort erscheint eine kurze Erklärung; der Nutzer bestimmt den Zeitpunkt des Weitergehens.

Die erste öffentliche Version umfasst:

- Sechs Kategorien und 1.200 freigegebene deutsche Fragen.
- Eine kostenlose Tagesrunde.
- Bis zu zwei fällige Wiederholungen innerhalb der Tagesrunde.
- Einen dauerhaften Erfahrungsfortschritt und ein Wochenziel.
- Ein persönliches Wissensalbum mit nachvollziehbaren Auszeichnungen.
- Frei wählbare Themenrunden über einen einmaligen Plus-Kauf.
- Eine kleine optionale Ergebnistabelle mit drei ausdrücklich als Computergegner bezeichneten Figuren.
- Lokale Speicherung, Wiederaufnahme und korrekt konfiguriertes Android-Systembackup.
- Freiwillige lokale Erinnerungen.
- Echten Play-Billing-Kauf, Wiederherstellung und Offline-Nutzung eines bereits bestätigten Kaufs.
- Ein vollständiges Store- und Veröffentlichungspaket.

Nicht zum ersten Release gehören Konten, Chat, echte Duelle, öffentliche Ranglisten, ein eigener Server, Werbe-SDKs, Abonnements, Nutzerfragen, tägliche KI-Aufrufe, eigene Sprachaufnahmen, eine 3D-Welt oder zusätzliche Währungen. Neue Ideen kommen in BACKLOG.md. Sie werden nicht während der Kernentwicklung eingebaut.

Das Alleinstellungsmerkmal ist die Kombination aus ruhiger Bedienung, passenden Fragen und Wiedergewusst. Eine vollständig neue Quizgattung wird nicht behauptet.

## 2 Arbeitsweise des Agenten

Lies vor Änderungen vorhandene AGENTS.md-Dateien und untersuche das Zielrepository. Erhalte vorhandene Nutzeränderungen. Verwende ein tragfähiges bestehendes Projekt weiter; beginne nur bei fehlender geeigneter Basis ein neues Flutter-Projekt. Baue für ein vorhandenes Git-Repository auf einem isolierten Branch oder Worktree, wenn das parallele Arbeit schützt. Verwende keinen destruktiven Reset und keinen Force-Push.

Die ersten Untersuchungen sind zeitlich begrenzt: dokumentiere die Ausgangslage, lege die nächsten Schritte fest und beginne die Umsetzung. Wiederholte Analyse darf die erste spielbare Runde nicht ersetzen.

Arbeite in kleinen, überprüfbaren Abschnitten. Jeder abgeschlossene Abschnitt liefert den betreffenden Code, die relevanten Prüfergebnisse und bei sichtbaren Änderungen echte Screenshots oder einen installierbaren Build. Commits sollen inhaltlich nachvollziehbar sein.

Pflege im Repository:

- ROADMAP.md: Phase, Aufgabe, Status, Abhängigkeit und Nachweis.
- DECISIONS.md: getroffene Produkt- und Architekturentscheidungen.
- BLOCKERS.md: externe Abhängigkeiten, konkrete benötigte Handlung und weiter mögliche Arbeit.
- CHANGELOG.md: tatsächlich umgesetzte Änderungen.
- QA_REPORT.md: ausgeführte Prüfungen, Ergebnis, Gerät/Umgebung und Build.
- CONTENT_REPORT.md: Fragezahlen, Quellenprüfung, Verteilung und offene Fehler.
- RELEASE_CHECKLIST.md: aktueller Stand der Veröffentlichungsfreigaben.
- KNOWN_ISSUES.md: verbleibende Einschränkungen mit Schweregrad.
- README.md: Start, Tests, Build und Übergabe.

Zulässige Aufgabenstatus sind todo, in_progress, done und blocked_external. Ein fehlender Play-Zugang blockiert keine unabhängige UI-, Inhalts- oder Testarbeit. Dokumentiere nur tatsächlich ausgeführte Tests als bestanden.

Routineentscheidungen löst der Agent anhand dieses Plans. Für irreversible Identitäten, reale Betreiberangaben, fehlende Zugänge und einen nicht bereits erteilten öffentlichen Veröffentlichungsauftrag fragt er gesammelt und konkret nach. Zuvor bereitet er alles unabhängig Machbare vor. Er erfindet weder Kontodaten noch menschliche Tester, Prüfergebnisse, Store-Freigaben oder Signierschlüssel.

Bei parallelen Agenten übernimmt einer Engine und Persistenz, einer Inhalte und Inhaltswerkzeuge, einer Gestaltung und Zugänglichkeit. Ein verantwortlicher Agent integriert, prüft Schnittstellen und entscheidet über den Gesamtrelease. Gleichzeitige Änderungen an denselben Dateien werden vermieden.

## 3 Produktregeln und Begriffe

Verbindliche Kategorien:

| ID | Anzeigename |
| --- | --- |
| nature_animals | Natur und Tiere |
| geography_travel | Länder und Reisen |
| everyday_technology | Alltag und Technik |
| history_discoveries | Geschichte und Entdeckungen |
| entertainment | Film, Musik und Fernsehen |
| language_culture | Sprache und Kultur |

Damals und heute ist eine Themenkennzeichnung über diese Kategorien hinweg. Sie erzeugt keinen zusätzlichen Spielmodus. Sport oder weitere Spezialgebiete können später als neuer Inhalt ergänzt werden.

Neue Frage bedeutet: Diese semantische Version wurde auf diesem Spielstand noch nicht beantwortet. Wiederholung bedeutet: Der Nutzer ist dieser semantischen Version bereits begegnet. Fällig bedeutet: Der frühestmögliche geplante Wiederholungstag ist erreicht.

Erfahrungspunkte messen den Tagesfortschritt. Sie sind kein IQ und kein objektiver Wissensgrad. Das Wissensalbum enthält Auszeichnungen nach offen beschriebenen Spielregeln.

Die App spricht Nutzer konsistent mit du an. Ihr Ton ist freundlich und sachlich. Fehler werden ohne Spott erklärt. Aussagen über Genie, IQ-Steigerung, Demenzprävention oder nicht gemessene Vergleichswerte werden nicht verwendet.

## 4 Spielablauf und Oberfläche

Die fünf Kernansichten sind Heute, Quiz, Ergebnis, Themen und Mein Wissen. Die Navigation hat drei Bereiche: Heute, Themen und Mein Wissen. Quiz und Ergebnis gehören zum Spielablauf. Einstellungen, Kaufdialog und rechtliche Informationen sind untergeordnete Ansichten; die Zahl fünf ist kein Verbot notwendiger Hilfsansichten.

Heute zeigt eine klare Hauptaktion zum Starten oder Fortsetzen der Tagesrunde, die aktuelle Wochenaktivität und den nächsten Erfahrungsaufstieg. Die erste Nutzung führt direkt zur ersten Frage. Es gibt kein verpflichtendes Interessenformular und keine Berechtigungsabfrage vor dem ersten Spiel.

Quiz zeigt Kategorie, Position in der Runde, Frage und vier Antwortflächen. Nach der Auswahl wird die Antwort zunächst gespeichert. Anschließend erscheinen korrekte Antwort und Erklärung. Die Auswahl ist danach gesperrt. Eine bewusst betätigte Weiter-Schaltfläche führt zur nächsten Frage.

Beim normalen Zurückgehen während einer unbeantworteten Frage wird Fortsetzen oder Zur Übersicht angeboten. Eine Unterbrechung verwirft keine Antworten. Abbruch darf nicht heimlich eine neue Frageauswahl ermöglichen.

Ergebnis zeigt richtige Antworten, Rundenmedaille, Erfahrungspunkte und höchstens einen weiteren aussagekräftigen Hinweis. Beispielsweise kann eine tatsächlich früher falsch beantwortete Frage als Wiedergewusst hervorgehoben werden. Die virtuelle Ergebnistabelle ist einklappbar und abschaltbar.

Themen zeigt sechs klar beschriftete Kategorien. Pro Kategorie ist eine kostenlose Kennenlernrunde mit fünf Fragen einmal pro lokalem Profil verfügbar. Ihr Startmix lautet drei leichte und zwei mittlere Fragen, mit denselben Verfügbarkeitsregeln wie andere Runden. Sie zählt als Themenrunde und vergibt keine Tages-XP. Plus erlaubt jederzeit weitere Themenrunden mit zehn Fragen. Probestatus und Probesession werden gemeinsam in einer Transaktion angelegt. Die Probe wird beim Anlegen verbraucht, kann aber nach Unterbrechung mit denselben Fragen fortgesetzt werden. Eine ausdrücklich aufgegebene Probe bleibt verbraucht. Der Probestatus wird lokal gespeichert und gegebenenfalls über das Systembackup wiederhergestellt.

Mein Wissen enthält erreichte Stufen, das Wissensalbum, historische Tagesergebnisse und getrennte Statistiken für Erstversuche und Wiederholungen. Gesammelte Erklärungen bleiben kostenlos zugänglich. Keine abstrakten Radar-Diagramme oder scheinpräzisen Wissensprozente über ein ganzes Fachgebiet.

## 5 Tagesauswahl und Zeitregeln

Beim ersten Start einer Tagesrunde wird die gesamte Session in einer Datenbanktransaktion erstellt. Zehn Frage-Snapshots, Antwortreihenfolgen, Seed, Katalogversion und Auswahlversion werden gespeichert. Ein bloßer Seed reicht nicht, da der Fragenkatalog später verändert werden kann.

Die Standardauswahl besteht aus maximal zwei fälligen Wiederholungsfragen. Die übrigen Positionen werden mit noch nicht beantworteten Fragen gefüllt. Fehlen fällige Wiederholungen, entstehen entsprechend mehr neue Positionen.

Für eine zehn Fragen lange Standardrunde dient eine Verteilung von sechs leichten, drei mittleren und einer anspruchsvollen Frage als Startkonfiguration. Bereits gewählte Wiederholungen werden auf diese Zielverteilung angerechnet. Verbleibende Plätze füllen zunächst Defizite der Verteilung auf. Bei erschöpften Teilmengen werden verfügbare Fragen verwendet; die Runde bleibt spielbar. Diese Mischung ist eine Produktentscheidung, keine garantierte Trefferquote.

Berücksichtige nach Möglichkeit mindestens vier Kategorien. Bevorzuge bei gleichen Bedingungen seltener verwendete Kategorien. Wiederholungsfälligkeit hat Vorrang vor einer perfekten Themenverteilung. Die Auswahl erfolgt reproduzierbar aus Installation-ID, lokalem Datum und Auswahlversion. Für das tatsächliche Fortsetzen gilt immer der gespeicherte Snapshot.

Keine Frage und kein über fact_key identifizierter gleicher Sachverhalt darf innerhalb einer Runde doppelt vorkommen. Fragen aus einer noch offenen anderen Session werden bis zu deren Abschluss oder ausdrücklichem Verlassen für neue Sessions reserviert.

Wenn ungesehene Fragen fehlen, ergänze geeignete ältere Fragen aus dem Bestand. Priorisiere einen Abstand von mindestens sieben Tagen; falls der vorhandene Pool das nicht zulässt, erweitere die Auswahl nachvollziehbar. Verwende keine Frage zweimal in einer Session. Benenne den Charakter der Runde sichtbar als Wiederholungsrunde, sobald der neue Vorrat nicht mehr reicht. Behaupte keinen endlosen Vorrat neuer Inhalte.

Themenrunden verwenden dieselbe Engine mit einem Kategoriefilter. Die einfache Themenmischung ist ebenfalls 6/3/1. Ein schwieriger Themenmodus darf in V1 mit der Mischung 2/5/3 angeboten werden, ohne eine neue Engine zu bauen. Wiederholungen und Vorratsgrenzen werden genauso behandelt.

Der day_key entspricht dem lokalen Kalenderdatum bei Erstellung der Tagesrunde. Zeitzone und Offset werden gespeichert. Diese Zuordnung bleibt nach Mitternacht oder auf Reisen gleich. Eine alte offene Runde kann über den Verlauf fortgesetzt werden. Die heutige Runde kann unabhängig davon erstellt werden. Pro Datum existiert höchstens eine Tagesrunde.

Sessions verwenden die Zustände active, completed und abandoned. Zur Übersicht pausiert eine Runde im Zustand active und behält Reservierungen. Eine getrennte, ausdrücklich bestätigte Aktion Runde aufgeben setzt abandoned und löst Reservierungen. Der Hinweis erklärt vorab, dass diese Runde dann nicht weitergespielt werden kann und eine Tagesrunde am selben Datum nicht neu gezogen wird. Bereits gespeicherte Antworten bleiben in der Lernhistorie. Es gibt höchstens eine aktive Themen- oder Proberunde zugleich; vor einer weiteren wird Fortsetzen oder Aufgeben angeboten. Reicht der Pool wegen offener Reservierungen nicht, zeigt die App passende offene Runden und einen verständlichen Hinweis statt einer Endlosschleife oder einer stillen Verletzung der Regeln.

Das Wochenziel zählt vier verschiedene abgeschlossene Tagesrunden-Daten in einer Montag-bis-Sonntag-Woche. Eine verspätet abgeschlossene Runde gehört zur Woche ihres ursprünglichen day_key. Übungsrunden erhöhen diesen Zähler nicht.

Eine versehentlich falsch eingestellte Uhr darf keine jahrelange Sperre verursachen. Ohne Serverzeit ist die Veränderung des Gerätedatums nicht zuverlässig manipulationssicher. Dieses lokale Freizeitquiz verspricht keinen Betrugsschutz gegen solche Eingriffe.

## 6 Antworten, Erfahrung und Auszeichnungen

Eine Antwort ist pro Sessionposition eindeutig. Speichere gewählte Antwort-ID, Richtigkeit und Zeitpunkt gemeinsam mit QuestionProgress, Fälligkeit und einer gegebenenfalls neuen Auszeichnung in einer Transaktion. Der konkrete Wiedergewusst-Hinweis wird als Ergebnis dieses Antwortereignisses gespeichert oder aus dessen unveränderlichen Daten reproduziert. Ein Absturz darf keine halb verbuchte Antwort hinterlassen. Verwende stabile Antwort-IDs und niemals den zufällig gemischten Listenindex als fachlichen Lösungsschlüssel.

Für eine reguläre abgeschlossene Tagesrunde gilt:

- Erfahrungspunkte = 20 Abschlussbonus plus 10 pro richtiger Antwort.
- Bei 7 richtigen Antworten werden 90 Erfahrungspunkte vergeben.
- Bronze ab 5, Silber ab 7, Gold ab 9 richtigen Antworten.
- Keine Minuspunkte und kein Tempobonus.
- Die Tagesbelohnung wird exakt einmal gebucht.
- Themen- und Proberunden vergeben keine Tages-XP; sie entwickeln Fragenhistorie und Album weiter.

Verwende ein RewardLedger mit eindeutigem Ereignisschlüssel daily-complete:<session_id>. Abschlussstatus und Belohnung werden gemeinsam gebucht. Zehnmaliges Öffnen des Ergebnisbildschirms verändert den Stand nicht.

Der Stufenverlauf bleibt simpel: Stufe 1 startet bei 0 XP, Stufe 2 bei 80, Stufe 3 bei 250, Stufe 4 bei 500. Ab Stufe 5 liegen jeweils weitere 500 XP zwischen den Stufen. Diese Werte stehen in einer zentralen Regelkonfiguration. Die Anzeige nennt Erfahrungsstufen, keine Intelligenzstufen. Die Sammlung bleibt bei ausgelassenen Tagen erhalten.

Bei einer falschen Antwort wird die betreffende semantische Version frühestens nach drei lokalen Kalendertagen wieder fällig. Nach einer ersten richtigen Antwort wird die nächste Wiederholung frühestens nach sieben Tagen vorgesehen; nach weiteren richtigen Wiederholungen nach 21 Tagen. Ein neuer Fehler setzt die Fälligkeit wieder auf drei Tage. Das ist ein einfacher Scheduling-Ansatz, keine medizinische oder pädagogische Leistungsdiagnose.

Für den Sammelstatus Sicher gewusst sind zwei richtige Antworten derselben semantischen Version mit mindestens drei Tagen Abstand erforderlich. Ein späterer Fehler entfernt die erworbene Karte nicht, erzeugt aber eine neue Fälligkeit.

Wiedergewusst wird nur ausgelöst, wenn die unmittelbar vorherige Antwort dieser semantischen Version falsch war und die aktuelle Antwort frühestens drei Kalendertage später richtig ist. Dadurch wird ein früherer Fehler nicht bei jeder beliebigen späteren Wiederholung erneut gefeiert. Sofortiges erneutes Üben darf ebenfalls richtig sein, löst jedoch diesen besonderen Hinweis noch nicht aus.

Erstversuchsstatistik und Wiederholungsstatistik werden getrennt berechnet. Eine semantisch veränderte Frage hat eine neue Lernhistorie. Erfolge werden nie mit erfundenen Gesamtbevölkerungswerten verglichen.

## 7 Umgang mit korrigierten Fragen

Jede Frage besitzt eine content_revision und eine semantic_revision. Eine reine Rechtschreibkorrektur erhöht nur content_revision. Ändern sich Bedeutung, Lösung oder fachlich relevante Antwortmöglichkeiten, steigt zusätzlich semantic_revision.

Historische Frage- und Antwort-Snapshots bleiben erhalten. Statistiken zur aktuellen Lernversion berücksichtigen keine veraltete semantische Version. Bereits vergebene XP und Auszeichnungen werden nicht nachträglich weggenommen.

Ein publizierter Sachfehler wird über eine Liste zurückgezogener Frageversionen für neue Auswahlen gesperrt. In einer noch offenen Session bleibt der ursprüngliche Snapshot aus Nachweisgründen gespeichert; die betroffene Position wird als void markiert und neutral übersprungen. Sie führt zu keiner neuen Antwortwertung oder Lernfortschrittsbuchung. Die App erklärt, dass die Frage korrigiert wird.

Der Ergebnisnenner N ist dann die Zahl gültiger Fragen. Zeige C von N statt fälschlich C von 10. Bei mindestens einer gültigen Frage erhält die vollständig abgeschlossene Tagesrunde 20 + 10*C XP und zählt für das Wochenziel. Bei N=0 gibt es weder XP noch einen Wochenpunkt. Medaillen werden nur bei N>=8 vergeben; dann gelten 50/70/90 Prozent richtige Antworten. Die virtuelle Ergebnistabelle wird ausschließlich bei N=10 gezeigt.

Ein schon vor Bekanntwerden des Fehlers abgeschlossenes Ergebnis bleibt als damaliges Ergebnis erhalten und erhält bei Bedarf einen Korrekturhinweis. Für aktuelle Lernstatistiken wird die zurückgezogene Frageversion ausgeschlossen. Implementiere diesen seltenen Sonderfall ausdrücklich; rechne nicht heimlich die gesamte Nutzerhistorie um.

Auch das Wissensalbum berücksichtigt Korrekturen. Zeige dort die gültige aktuelle Erklärung mit Korrekturkennzeichnung. Fehlt eine zuverlässige Korrektur, erscheint ein neutraler Prüfhinweis. Eine bekannte falsche Erklärung darf nicht unmarkiert als Wissen weiter angezeigt werden. Das historische Abzeichen bleibt als erreichte Auszeichnung erhalten; die alte Fassung ist nur als ausdrücklich ungültiges Archivmaterial zugänglich.

## 8 Virtuelle Quizrunde

Die optionale Vergleichstabelle ist in V1 ein kleines Element des Tagesergebnisses, kein eigener Spielmodus. Sie kann in den Einstellungen ausgeblendet werden. Über der Tabelle und an jeder erklärungsbedürftigen Stelle steht Virtuelle Quizrunde oder Computergegner. Verwende keine Online-Anzeigen, realistisch vorgetäuschten Nutzerprofile, Standorte, Chatnachrichten oder Warteanimationen.

Drei fiktive Figuren genügen. Eine Figur bevorzugt Natur und Alltag, eine Länder und Geschichte, eine Unterhaltung und Kultur. Verwende einfache Illustrationen oder Symbole.

Die Konfiguration besitzt Grundwahrscheinlichkeiten je Schwierigkeitsstufe, beispielsweise leicht 0,80, mittel 0,60, anspruchsvoll 0,35. Die Spezialgebiete erhalten einen begrenzten Bonus von 0,10, übrige Gebiete einen Abschlag von 0,05; Werte bleiben zwischen 0,15 und 0,95. Diese Zahlen definieren eine Simulation, keine gemessenen Personen.

Berechne die Antworten beziehungsweise Richtig-falsch-Ergebnisse bei Erstellung der Session mit einem separaten gespeicherten Seed. Die Figuren erhalten genau die zehn ausgewählten Fragen. Ihre Ergebnisse werden anschließend nicht an die Antworten des Nutzers angepasst. Speichere die Ergebnisse für Wiederaufnahme und Ergebnisansicht.

Zeige Trefferzahlen und Gleichstände nachvollziehbar. Ein Nutzer darf gewinnen oder verlieren. Passe Siege nicht nachträglich künstlich an. Medaillen, Tages-XP und Sammlung hängen nicht vom Abschneiden gegen Computerfiguren ab.

## 9 Gestaltung und Zugänglichkeit

Verwende eine ruhige, erwachsene Gestaltung. Ausgangsrichtung: warmes Hell, dunkles Petrol oder Tannengrün, dunkler Text und sparsame Goldakzente. Gold ist vorzugsweise dekorativ; sein Textkontrast muss gesondert geprüft werden. Fragen und Antworten erhalten klare serifenlose Schrift. Schriften, Icons und Töne werden mit passenden Lizenzen eingebunden und lokal verfügbar gemacht.

Gestaltungsziele:

- Fragen ungefähr 22 bis 24 logische Pixel vor Systemskalierung.
- Antworttext ungefähr 18 bis 20 logische Pixel.
- Antwortflächen mindestens 64 logische Pixel hoch und bei Bedarf mitwachsend.
- Vier Antworten vertikal; kein enges Raster.
- Textkontrast mindestens 4,5:1.
- Fehler- und Erfolgszustände über Text und Symbole, zusätzlich zu Farbe.
- Kein automatischer Wechsel nach einer Antwort.
- Bewegung sparsam; reduzierte Bewegung berücksichtigen.
- Ton und Haptik unabhängig abschaltbar.
- Alle Kernaktionen mit verständlicher Beschriftung.

Android nennt mindestens 48 dp als allgemeines Touchziel und unterstützt starke Systemschriftvergrößerung. Prüfe echte Layouts mit maximaler Schriftgröße. Abschneiden, Textverkleinerung zur Platzersparnis oder das Begrenzen der Systemskalierung sind keine zulässige Problemlösung. Scrollen ist bei großer Schrift erlaubt. Quellen S9 und S10.

Teste mindestens 360x640 und 360x800 logische Pixel sowie ein größeres Display. Smartphone-Hochformat ist der primäre Gestaltungsfall. Die App muss bei anderer verfügbarer Fenstergröße dennoch sinnvoll reagieren. Eine erzwungene Orientierung darf nicht als Ersatz für responsive Layouts dienen.

TalkBack muss Frage, Position, Antwortauswahl und Rückmeldung in sinnvoller Reihenfolge vermitteln. Dekoration wird passend ausgeblendet. Sechs Themensymbole, ein Kartensystem und ein wiederverwendbares Medaillensystem reichen für V1.

## 10 Technische Architektur

Bei einem neuen Projekt gelten folgende Defaults:

- Flutter und Dart in einer aktuellen stabilen, kompatiblen Version.
- SQLite mit Drift für strukturierte lokale Daten und Migrationen.
- Riverpod für Zustand und Abhängigkeiten.
- Das von flutter.dev veröffentlichte in_app_purchase für Play Billing.
- Ein gepflegtes Plugin für lokale Benachrichtigungen, wenn es mit der Toolchain kompatibel ist.
- Keine zusätzliche globale State-Library, kein zweites Datenbanksystem und kein Backend.

Vorhandene gleichwertige Architektur wird nicht aus kosmetischen Gründen ersetzt. Versionsauswahl, Plattformanforderungen und tatsächliche Abhängigkeiten werden zu Beginn überprüft und anschließend reproduzierbar festgehalten. Keine schwebenden ungebundenen Paketversionen im Release.

Trenne drei Bereiche: Oberfläche, reine Spiellogik und Datenzugriff. Auswahl, Auswertung, Fälligkeit, Stufen und Simulation sind reines Dart und erhalten injizierbare Uhr sowie Zufallsquelle. UI-Widgets führen keine SQL-Abfragen und keine Kaufvalidierung aus.

Ein sinnvoller Aufbau umfasst app, core, domain, data und features. Unter features liegen today, quiz, results, topics, knowledge, settings und billing. Die genaue Dateiaufteilung darf pragmatisch bleiben.

Die redaktionellen Quelldateien werden getrennt von einem gebauten Runtime-Katalog gehalten. Ein reproduzierbares Inhaltswerkzeug validiert, filtert freigegebene Fragen und erzeugt den gebündelten Katalog sowie dessen Manifest. Quellen- und Prüfprotokolle bleiben im Repository nachvollziehbar; das App-Bundle erhält nur benötigte Laufzeitdaten und nutzbare Quellenverweise.

Standardplattform am Recherchestand: minSdk 24 als Produktentscheidung, targetSdk mindestens 36, compileSdk passend zur Toolchain. Die tatsächlich eingebundene native Play Billing Library muss zum Veröffentlichungszeitpunkt zulässig sein; am 20.11.2026 mindestens Version 8. Die aktuellen Anforderungen werden vor dem Release erneut geprüft. Quellen S1 bis S4.

## 11 Lokale Daten und Backup

Mindestens folgende Datenobjekte werden benötigt:

| Objekt | Zweck und zentrale Felder |
| --- | --- |
| Session | ID, Modus, day_key, Status, Seed, Auswahlversion, Katalogversion, Start und Abschluss |
| SessionQuestion | Position, unveränderlicher Frage-Snapshot, Antwortreihenfolge, Art neu oder Wiederholung, void-Status |
| Answer | Sessionposition, Antwort-ID, Richtigkeit, Zeitpunkt |
| QuestionProgress | Frage-ID und semantische Version, erste und letzte Antwort, Fälligkeit, richtige Termine, letzter Fehler, Sammelstatus |
| RewardLedger | eindeutiger Ereignisschlüssel, XP, Buchungszeit |
| TopicTrial | Kategorie und verbrauchter Probestatus |
| Settings | Darstellungs-, Ton-, Haptik- und Erinnerungseinstellungen |
| Entitlement im separaten Speicher | Plus-Status, Produkt-ID, Kaufverarbeitung und letzter erfolgreicher Store-Abgleich; nicht in der gesicherten Spielstanddatenbank |

Constraints sichern genau eine Antwort pro Position, genau eine Tagesrunde pro day_key und genau eine Tagesbelohnung pro Session. Datenbankmigrationen erhalten reale historische Spielstände. Das aktuelle Schema muss mit mindestens einer älteren gespeicherten Version getestet werden.

Spielstand und Einstellungen dürfen über das Android-Systembackup gesichert werden. Das ist keine eigene Kontosynchronisation und keine Garantie für eine Wiederherstellung. Beschreibe diese Grenze verständlich.

Kaufdaten, Token, Entitlementcache und installationsgebundene Werte werden in einem separaten geschützten Bereich gehalten und aus Cloudbackup sowie Gerätetransfer ausgeschlossen. Eine neue Installation erzeugt eine neue Installation-ID. Wiederhergestellte bestehende Sessions behalten ihre gespeicherten Seeds und Snapshots.

Konfiguriere sowohl die für unterstützte ältere Android-Versionen nötigen Backup-Regeln als auch moderne data-extraction-rules. Sichere keine großen Diagnosebilder oder unveränderlichen Inhaltsassets. Teste Backup und Wiederherstellung; Android dokumentiert konfigurierbare Ein- und Ausschlüsse. Quelle S8.

Spielstand zurücksetzen benötigt eine verständliche lokale Bestätigung, löscht aber keinen echten Play-Kauf. Plus wird über Google Play wiederhergestellt. Kaufwiederherstellung ist nicht gleich Spielstandwiederherstellung.

## 12 Inhalte und redaktionelle Freigabe

Die öffentliche V1 enthält 1.200 freigegebene Fragen, jeweils 200 pro Kategorie. Pro Kategorie sind zunächst 120 leicht, 60 mittel und 20 anspruchsvoll vorgesehen. Ein früher Referenzbestand umfasst 150 Fragen, jeweils 25 pro Kategorie. Er ist Teil des späteren Gesamtbestands.

Alle Fragen benötigen genau eine vertretbare richtige Antwort, vier unterschiedliche Möglichkeiten, eine kurze Erklärung, zuverlässige Quellen und eine nachvollziehbare Prüfung. Der Agent recherchiert Quellen tatsächlich und dokumentiert Prüfer sowie Prüfart wahrheitsgemäß. Agentenprüfung darf nicht als menschliche Freigabe bezeichnet werden.

Verwende drafts, Prüfschritte und release_approved als echte Zustände. Ein Source-Link ohne gelesenen Beleg reicht nicht. Ein weiterer KI-Aufruf ohne Quellenprüfung zählt nicht als Sachprüfung. Ein zweiter unabhängiger Prüfdurchgang kontrolliert Mehrdeutigkeit, Sprache und Antwortlogik.

Automatische Prüfungen kontrollieren Schema, Antwort-IDs, Textlängen, Dubletten, fact_key, Kategorien, Verteilung und abgelaufene Inhalte. Verdächtige Ähnlichkeiten erfordern eine begründete redaktionelle Entscheidung. Dieselben Fakten dürfen nicht nur umformuliert werden, um die Menge zu erreichen.

Die erste Zielgruppe erprobt den Referenzbestand in echten Runden. Nur tatsächlich gesehene oder kommentierte Fragen werden als menschlich erprobt protokolliert. Die Erprobung ersetzt nicht die Quellenprüfung des übrigen Bestands.

Bevorzuge zeitlich stabile Themen. Exakte Bedingungen sind bei Superlativen und historischen Erstleistungen erforderlich. Vermeide Fangfragen, verräterische Antwortlängen, unnötige Verneinungen und unklare regionale Voraussetzungen. West- und ostdeutsche Zeitgeschichte wird bei Bedarf eingegrenzt.

Film- und Musikfragen verwenden zum Start Text. Es werden keine ungenehmigten Fotos, Liedausschnitte oder übernommenen Konkurrenz-Fragensammlungen eingebaut.

Das vollständige Datenformat und die Freigaberegeln stehen in docs/CONTENT_SPEC.md und specs/question.schema.json. Der Agent baut daraus einen tatsächlich ausführbaren Validator; das Schema allein ersetzt keine inhaltliche Prüfung.

## 13 Plus und Monetarisierung

Kostenlos bleiben die Tagesrunde, Erfahrung, Wochenziel, Wiedergewusst, Sammlung und Erklärungen. Pro Kategorie gibt es eine einmalige Proberunde. Plus eröffnet beliebig viele Themenrunden mit dem vorhandenen Bestand und die zusätzliche Schwierigkeitswahl. Wiederholungen sind bei häufigem Spielen normal und werden nicht als unbegrenzt neue Fragen beworben.

Ein einziges nicht verbrauchbares Produkt genügt. Technischer Produktname als Default: quizsalon_plus. Ein deutscher Startpreis von 5,99 EUR ist eine zu testende Preisentscheidung. Der Kaufdialog zeigt immer den tatsächlichen lokalisierten Preis aus Play-Produktdaten.

V1 arbeitet ohne eigenes Kaufbackend. Google dokumentiert Client-only-Acknowledgement, empfiehlt aber serverseitige Prüfung. Die lokale Lösung bleibt manipulierbar und erkennt einen späteren Entzug erst bei erfolgreicher Store-Abfrage. Diese Architekturgrenze wird in DECISIONS.md festgehalten, nicht als vollständige Betrugssicherheit dargestellt. Quellen S3 und S5.

Die Kaufimplementierung unterscheidet unbekannt, nicht berechtigt, pending, berechtigt, Fehler und tatsächlich entzogen. Sie verarbeitet Produkt- und Paketidentität sowie die verfügbaren Original-Kaufdaten. Lokale Signaturprüfung verwendet das aktuelle dokumentierte Format und den öffentlichen Play-Lizenzschlüssel. Server- oder Service-Account-Geheimnisse gehören nie in die App.

Es gibt keine pauschal erfolgreiche Verify-Funktion, keine Freischaltung durch einen bloßen Buttonklick und keine Demo-Kauflogik in einem Produktionsbuild. Test-Doubles sind ausschließlich in Tests oder klar getrennten Entwicklungsvarianten zulässig.

Nach erfolgreicher Verarbeitung werden Berechtigung und Verarbeitungsstatus dauerhaft gespeichert und der Kauf über die Plattform bestätigt. Das Produkt wird nicht konsumiert. Nicht abgeschlossene Bestätigungen werden erneut versucht. Ausstehende Zahlungen schalten noch nichts frei. Quelle S3.

Store-Abgleich erfolgt beim relevanten Start, bei Wiederaufnahme des Kaufablaufs und nach Wiederverbindung. Ein Netzwerkfehler löscht kein bestätigtes Entitlement. Ein erfolgreicher vollständiger Abgleich ohne vorhandene Berechtigung aktualisiert dagegen den Plus-Zugang. Laufende Runden können beendet werden; erspielte Daten bleiben bestehen.

Ein bestätigter Kauf bleibt offline nutzbar. Ohne Verbindung sind neue Käufe und verlässliche Wiederherstellung nicht möglich. Der Kaufdialog zeigt einen verständlichen Zustand statt einer Endlosschleife.

Die vollständige reale Kauf-Testmatrix und die Grenzen bei Erstattung versus Widerruf stehen in docs/ABNAHME_UND_RELEASE.md. Mock-Ergebnisse ersetzen keinen Play-Lizenztest. Quelle S6.

## 14 Erinnerungen, Datenschutz und Support

Erinnerungen sind standardmäßig aus. Biete ihre Einrichtung erst nach einem abgeschlossenen Spiel oder in den Einstellungen an. Nutzer wählen selbst eine Uhrzeit. Verwende lokale, für dieses unkritische Tagesritual nicht minutengenau garantierte Benachrichtigungen. Fordere keine Sonderberechtigung für exakte Alarme an, wenn ein normaler lokaler Reminder genügt.

Falls Android eine Benachrichtigungsberechtigung benötigt, wird sie erst nach der aktiven Entscheidung zum Einschalten angefragt. Ablehnung beeinträchtigt das Quiz nicht. Deaktivieren entfernt anstehende Reminder. Sommerzeit und Zeitzonenwechsel werden getestet.

V1 enthält kein Werbe- oder externes Analytics-SDK. Sammle für die geschlossene Erprobung nur die notwendigen lokalen Nutzungswerte. Ein optionaler Export wird vom Nutzer ausgelöst und beschreibt seinen Inhalt. Automatisches Versenden findet nicht statt.

Eine Datenschutzerklärung, zutreffende Data-Safety-Angaben und reale Kontaktinformationen werden vorbereitet. Lokale Verarbeitung, Play-Käufe, Systembackup und ein optional vom Nutzer gesendeter Fehlerbericht werden unterschieden. Keine pauschale Behauptung, die App verarbeite überhaupt keine Daten. Google verlangt auch für entsprechende lokale Apps eine Datenschutzerklärung. Quelle S11.

Frage melden öffnet einen vorbefüllten, vom Nutzer kontrollierten Kontaktweg mit Frage-ID, semantischer Version und App-Version. Es werden keine Kauf-Token angehängt. Fehlt ein passender E-Mail-Client, kann der Nutzer den Text kopieren. Der Agent versendet keine Nachrichten im Namen des Nutzers.

Öffentliche Betreiber- und Kontaktdaten werden nicht ausgedacht. Fehlende Angaben sind ein klarer externer Release-Blocker; sie verhindern nicht die übrige Umsetzung.

## 15 Umsetzungsphasen

### Phase 0 Repository und Entscheidungen

Prüfe Projekt, vorhandene Regeln, Laufzeit und Android-Werkzeuge. Dokumentiere vorhandene Basis, gewünschte Zielstruktur und externe Abhängigkeiten. Lege ROADMAP, DECISIONS und BLOCKERS an. Übernimm die zentralen Produktregeln aus diesem Paket.

Ergebnis: reproduzierbarer Projektstart, kurzer Architekturentscheid, dokumentierte Toolchain und geordnete Aufgaben. Kein mehrtägiger Analyseblock ohne erste Implementierung.

### Phase 1 Gestaltung und erster Durchlauf

Baue Designsystem, Heute, Frage und Ergebnis mit mindestens 20 geprüften Fragen. Alle sichtbaren Kernaktionen funktionieren. Erstelle einen installierbaren Test-APK und Screenshots des tatsächlichen Ablaufs.

Abnahme: zehn Fragen können ohne Anleitung beantwortet werden; Erklärungen bleiben lesbar; das Ergebnis beruht auf den tatsächlichen Antworten. Noch nicht implementierte Persistenz oder Fortschrittsfunktionen werden in dieser frühen Testversion nicht vorgetäuscht.

### Phase 2 Inhaltssystem und Referenzbestand

Implementiere das Fragen-Schema, Validatoren, Runtime-Katalogbau und Inhaltsmanifest. Erstelle 150 belegte Fragen mit 25 je Kategorie. Beginne mit zwei getrennten Prüfrollen für Fakten und Redaktion.

Abnahme: reproduzierbarer Katalog, Quellen- und Prüfprotokoll, kein Entwurf im freigegebenen Bestand. Bereite einen kurzen Zielgruppentest vor.

### Phase 3 Persistenz und Tagesrunde

Implementiere SQLite-Schema, Transaktionen, Session-Snapshots, Wiederaufnahme, Tagesauswahl, Datum-/Zeitzonenregeln und Fallbehandlung bei erschöpftem Bestand. Prüfe Neustart an den Übergängen vor Antwort, nach Antwort und vor Ergebnis.

Abnahme: eine Runde bleibt nach Beenden der App identisch; doppelte Aktionen erzeugen weder neue Fragen noch doppelte Belohnungen. Ein Katalogupdate verändert gespeicherte gültige Fragen nicht.

### Phase 4 Fortschritt und Wiedergewusst

Implementiere RewardLedger, Stufen, Medaillen, Wochenziel, Fälligkeit, Wissensalbum und getrennte Statistik. Baue semantische Revisionen und die Behandlung zurückgezogener Fragen ein.

Abnahme: die im Regelwerk genannten Beispielrechnungen und Grenzfälle stimmen. Screenshots zeigen echte vorbereitete Testzustände, die als solche dokumentiert sind.

### Phase 5 Themen und virtuelle Ergebnisse

Implementiere Kategorien, kostenlose Proberunden, Plus-Zugangsgrenzen und den schwierigen Themenmix. Ergänze die kleine optionale Computervergleichstabelle. Kaufabhängige Funktionen können zunächst über einen klar getrennten Testadapter geprüft werden.

Abnahme: Themenrunden vergeben keine Tages-XP; Computerergebnisse stehen vor der Nutzerleistung fest und werden eindeutig gekennzeichnet. Die Produktionskonfiguration besitzt keinen freischaltenden Testschalter.

### Phase 6 Vollständiger Fragenbestand

Erweitere parallel in kontrollierten Batches auf 600 und danach 1.200 freigegebene Fragen. Prüfe Verteilung, fact_key, Plausibilität und Quellen. Behebe Rückmeldungen aus den frühen Tests, bevor du identische Schwächen massenhaft vervielfältigst.

Abnahme: 200 Fragen pro Kategorie, 120/60/20 je Schwierigkeitsstufe, keine offenen kritischen Sachfehler und kein künstliches Auffüllen durch Dubletten. Erzeuge CONTENT_REPORT und Manifest aus den echten Dateien.

### Phase 7 Echte Käufe und Plattformfunktionen

Richte vor den realen Kauftests mit vorhandenen autorisierten Zugängen die vorbereitende Play-Console-App, den endgültigen Paketnamen, das einmalige Produkt, Lizenztestkonten und einen internen Test-Track ein. Diese interne Testbereitstellung ist noch keine öffentliche Veröffentlichung. Stelle ihren konkreten Zugangsbedarf frühzeitig in Phase 0 fest und bereite sie parallel zu Phase 6 vor.

Integriere Play Billing, Entitlement-Reconciliation, Wiederherstellung, Bestätigung, Offlinecache und die tatsächlichen Kaufzustände. Ergänze Reminder, Systembackup, Zurücksetzen und Supportweg.

Abnahme: automatisierte Kaufzustandstests und zusätzlich echte Play-Lizenztests sind dokumentiert. Falls externer Zugang fehlt, bleibt genau dieser Nachweis blocked_external; die übrigen Arbeiten gehen weiter.

### Phase 8 Reale Nutzung und Qualitätsprüfung

Führe die in docs/ABNAHME_UND_RELEASE.md beschriebene Geräte-, Zugänglichkeits-, Daten- und Nutzungsprüfung durch. Lass ungefähr 12 bis 15 passende Personen die App sieben bis vierzehn Tage nutzen. Ein frühes Beobachten mit fünf Personen kann bereits nach Phase 2 stattfinden.

Abnahme: reale Testergebnisse, korrigierte Bedienprobleme und keine offenen kritischen Fehler. Freiwillige Rückkehr ist eine Produktbewertung; ein kleiner Test liefert keine allgemeine Marktprognose.

### Phase 9 Store und Veröffentlichungspaket

Erstelle echte Store-Screenshots, Icon, Feature Graphic, deutsche Texte, Datenschutzinventar und Supportangaben. Baue signiertes AAB und Test-APK; dokumentiere SHA256, Version, Commit und Inhaltsversion. Prüfe Plattformanforderungen erneut.

Abnahme: das Paket erfüllt die Release-Checkliste und ist mit realen Daten vollständig. Fehlende Kontoinformationen oder Schlüssel sind konkret benannt. Ein Debug-Build wird niemals als veröffentlichungsfertig bezeichnet.

### Phase 10 Play Console und öffentliche Veröffentlichung

Verwende vorhandene autorisierte Zugänge. Prüfe den konkreten Produktionsstatus des Entwicklerkontos sowie die in Phase 7 vorbereitete App und ihr Produkt. Liefere den endgültigen Release-Kandidaten über den passenden Test-Track aus und prüfe ihn erneut. Erledige erforderliche Console-Erklärungen wahrheitsgemäß.

Wenn ein öffentlicher Veröffentlichungsauftrag bereits vorliegt, führe den zulässigen Einreichungsablauf nach bestandenen Gates aus. Fehlt er, lege dem Nutzer das vollständige Ergebnis einschließlich Build, Store-Vorschau und offener Punkte zur konkreten finalen Entscheidung vor. Verlange keine pauschale erneute Genehmigung für bereits beauftragte Schritte.

Google-Review ist ein externer Prozess. Nach Einreichung bleibt der Status eingereicht, bis eine tatsächliche Freigabe oder öffentliche Verfügbarkeit beobachtet wurde. Ein erfolgreicher Upload allein erfüllt das Ziel veröffentlicht nicht.

### Phase 11 Stabilisierung nach Veröffentlichung

Prüfe nach realer Veröffentlichung den öffentlichen Store-Link, installiere die ausgelieferte Version und kontrolliere Tagesrunde, Kauf und Wiederherstellung. Bearbeite echte Abstürze, Rückmeldungen und Inhaltsfehler. Nutze verfügbare Play-Berichte; erfinde keine Retentionzahlen ohne Messgrundlage.

Bei einem kritischen Problem wird die Verteilung nach den verfügbaren Console-Möglichkeiten gestoppt oder eine korrigierte Version mit höherem versionCode vorbereitet. Ein Datenbankschema lässt sich nicht durch einen bloßen Rücksprung auf einen alten Build zuverlässig zurückrollen.

Neue Modi und Werbemonetarisierung bleiben im Backlog, bis Kernnutzung und Stabilität bewertet sind.

## 16 Zeit und Produktionsrisiken

Eine kleine erste Testversion kann in wenigen Arbeitstagen entstehen. Die frühe Spanne von 40 bis 80 technischen Stunden beschreibt einen optimistischen kleinen Kern; der vollständig spezifizierte Release mit Billing, Migrationen, Zugänglichkeit, Inhaltswerkzeugen und realer Prüfung benötigt zusätzliche Zeit.

Plane Aufgaben anhand tatsächlicher erster Durchläufe neu. Als Budgetansatz sind 80 bis 140 technische Arbeitsstunden plus Inhaltsrecherche, Redaktion und externe Testzeit vernünftiger als ein Wochenendeversprechen. Diese Spannen sind Schätzungen und keine Lieferzusage.

Bei angenommenen fünf Minuten sachlicher Prüfung und Redaktion pro Frage entsprechen 1.200 Fragen 100 Arbeitsstunden. Agentenunterstützung kann Teile beschleunigen. Sie rechtfertigt kein automatisch behauptetes Qualitätsniveau.

Die externe Erprobung benötigt echte Kalendertage. Eventuelle Google-Kontovorgaben, Review-Zeiten, Zugänge und Schlüssel kommen als Abhängigkeiten hinzu. Plane Inhaltsarbeit, Technik und Zielgruppentests so weit sinnvoll parallel. Keine künstlichen Prozentmeldungen ohne erledigte Abnahmepunkte.

## 17 Fertig bedeutet

Technisch fertig bedeutet: vereinbarte Funktionen implementiert, relevante automatisierte Tests bestanden, Inhalte freigegeben und keine offenen kritischen Defekte.

Veröffentlichungsbereit bedeutet zusätzlich: reale Geräte- und Kaufprüfung, ehrliche Zielgruppenrückmeldungen, signiertes AAB, vollständige Store-Angaben und alle erforderlichen externen Voraussetzungen.

Eingereicht bedeutet: der konkrete Build wurde tatsächlich zur Prüfung übermittelt.

Öffentlich verfügbar bedeutet: Google hat den Release freigegeben, der Store-Eintrag ist erreichbar und die ausgelieferte Version wurde überprüft.

Der Abschlussbericht enthält den genauen Status, nutzbare Artefakte, Commit, Inhaltsversion, Prüfergebnisse, bekannte Grenzen, externe Restschritte und den nächsten konkreten Handlungsschritt. Ein einzelnes grünes Testkommando ist kein Nachweis für eine fertige App.

## 18 Quellen für aktuelle Plattformentscheidungen

Die Quellen wurden für diese Planung am 20. November 2026 geprüft. Der umsetzende Agent überprüft zeitabhängige Anforderungen erneut zu Projektstart und unmittelbar vor der Einreichung.

- S1: [Google Play Target API](https://developer.android.com/google/play/requirements/target-sdk)
- S2: [Play Billing Versionsfristen](https://developer.android.com/google/play/billing/deprecation-faq)
- S3: [Play Billing Integration](https://developer.android.com/google/play/billing/integrate)
- S4: [Flutter in_app_purchase](https://pub.dev/packages/in_app_purchase)
- S5: [Kaufabsicherung](https://developer.android.com/google/play/billing/security)
- S6: [Reale Billing-Tests](https://developer.android.com/google/play/billing/test)
- S7: [Flutter Android Release](https://docs.flutter.dev/deployment/android)
- S8: [Android Auto Backup](https://developer.android.com/identity/data/autobackup)
- S9: [Android Accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
- S10: [Systemschrift bis 200 Prozent](https://developer.android.com/about/versions/14/features)
- S11: [Google Play Nutzerdaten und Datenschutz](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- S12: [16-KB-Speicherseiten](https://developer.android.com/guide/practices/page-sizes)
- S13: [Play Store Medien](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)
- S14: [Play App anlegen](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
- S15: [Testanforderungen für neue persönliche Konten](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

