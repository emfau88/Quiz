# Content Spezifikation für Quizsalon

Diese Spezifikation steuert die redaktionellen Quelldateien und ihre Freigabe für die erste deutsche Android-Version. Das Schema in specs/question.schema.json beschreibt genau einen vollständigen Fragedatensatz. Es enthält keine echten Quizfragen. Das Produktionsbundle darf ausschließlich tatsächlich recherchierte und freigegebene Inhalte enthalten.

## 1 Umfang und Kategorien

Der öffentliche Startbestand umfasst 1.200 aktive, freigegebene Fragen und 1.200 verschiedene fact_key-Werte. Der anfängliche Referenzbestand mit 150 Fragen ist darin enthalten. Zurückgezogene Fragen und historische Versionen zählen nicht zur Sollmenge.

| Kategorie ID | Kategorie | Leicht | Mittel | Anspruchsvoll | Gesamt |
| --- | --- | ---: | ---: | ---: | ---: |
| nature_animals | Natur und Tiere | 120 | 60 | 20 | 200 |
| geography_travel | Länder und Reisen | 120 | 60 | 20 | 200 |
| everyday_technology | Alltag und Technik | 120 | 60 | 20 | 200 |
| history_discoveries | Geschichte und Entdeckungen | 120 | 60 | 20 | 200 |
| entertainment | Film, Musik und Fernsehen | 120 | 60 | 20 | 200 |
| language_culture | Sprache und Kultur | 120 | 60 | 20 | 200 |
| Gesamt | | 720 | 360 | 120 | 1.200 |

Die Schemawerte der Schwierigkeit heißen easy, medium und hard. Für den Referenzbestand gelten 25 Fragen je Kategorie, davon 15 leicht, sieben mittel und drei anspruchsvoll. Die Schwierigkeitszuordnung ist zunächst eine redaktionelle Einschätzung. Eine erwünschte Trefferquote von etwa 70–85 Prozent ist eine Testhypothese, kein belegter Sollwert und kein durch diese Verteilung garantiertes Ergebnis.

Damals und heute ist ein Themen-Tag über den bestehenden Kategorien. Zeit- und Regionalbezüge müssen zur Frage passen; eine bestimmte Lebensgeschichte wird nicht vorausgesetzt.

## 2 Redaktionelle Mindestqualität

Jede Frage hat vier sachlich unterscheidbare Antworten und unter den formulierten Bedingungen genau eine richtige Antwort. Die Erklärung benennt verständlich, weshalb die Antwort stimmt, oder ergänzt einen passenden Zusammenhang. Antwortreihenfolgen sind beliebig mischbar; Verweise wie die erste Antwort und alle oben genannten sind ausgeschlossen.

Standardgrenzen sind 180 Zeichen für die Frage, 80 je Antwort und 320 für die Erklärung. Eine begründete, dokumentierte Ausnahme in review.length_exception erlaubt maximal 240, 120 und 500 Zeichen. Die Ausnahme erfordert eine konkrete Lesbarkeitsprüfung bei großer Schrift; sie ist kein pauschaler Freibrief für lange Texte. Die Grenzen zählen Unicode-Codepoints gemäß JSON Schema.

Unzulässig sind mehrdeutige Superlative, unbestimmte zeitliche Angaben, unbeabsichtigte Lösungshinweise durch Grammatik oder Antwortlänge, unverständliche Verneinungen und ungeprüfte KI-Behauptungen. Fragen dürfen anspruchsvoll sein; ihre Formulierung darf keine künstliche Falle bilden. Sprachstil: einheitliches, respektvolles Du, kurze Sätze, keine herablassenden Altersansprachen und keine IQ- oder Gesundheitsversprechen.

Bevorzugt werden zeitlich stabile Fakten. Bei zeitabhängigen Aussagen muss der Zeitraum in der Frage stehen; valid_until bestimmt zusätzlich das späteste Freigabedatum. Null ist für langfristig gültige Fakten zulässig. Überschrittene Gültigkeit sperrt die Frage für neue Runden, bis sie geprüft wurde.

Eigene Formulierungen verwenden. Keine Konkurrenz-Fragenpools kopieren. Der erste Bestand benötigt keine Fotos, Filmstills, Liedausschnitte oder sonstigen Medien mit ungeklärten Rechten.

## 3 Quellen und Prüfdurchgänge

Die Zustände heißen draft, fact_checked, editorially_checked, release_approved und retired. Ein Zustand wird erst nach Durchführung des jeweiligen Schritts gesetzt.

1. Entwurf erstellen, erforderlichen Sachverhalt und passende Quelle bestimmen.
2. Die Quelle tatsächlich öffnen und die richtige Antwort samt Einschränkungen prüfen. Suchtreffer oder ein KI-generierter Quellenname genügen nicht. Den belegten Sachverhalt in eigenen Worten als verified_claim festhalten; checked_at ist der tatsächliche Abrufzeitpunkt.
3. In einem zweiten, getrennten Prüfdurchgang Frage, sämtliche Antwortmöglichkeiten und Erklärung erneut gegen die belegten Tatsachen prüfen. Zusätzlich Sprache, Eindeutigkeit, Kategorie, Schwierigkeit und mögliche unbeabsichtigte Hinweise prüfen. Der Prüfer darf derselbe Agent sein, muss aber einen tatsächlichen zweiten Durchgang protokollieren.
4. Schema, Querverweise, Dubletten und Verteilung prüfen. Offene Probleme vor der Freigabe lösen.
5. Freigabezeitpunkt und tatsächlichen Verantwortlichen dokumentieren.

Bevorzugte Quellen sind zuständige Institutionen, Museen, wissenschaftliche Einrichtungen und andere verlässliche Originalquellen. Bei strittigen oder interpretationsabhängigen Aussagen eine zweite unabhängige Quelle verwenden oder die Frage ersetzen. Eine nicht mehr erreichbare Quelle verhindert die Behauptung einer erfolgten Prüfung; bereits vorhandene belegte Prüfnachweise müssen nachvollziehbar bleiben.

Actor-Typen sind agent und human. Agentenprüfung wird niemals als menschliche Prüfung bezeichnet. Quellen-IDs in beiden Prüfprotokollen müssen auf tatsächlich geprüfte Einträge in sources verweisen. Der zweite Durchgang darf nicht vor dem ersten protokolliert sein. Fehlgeschlagene Prüfungen setzen keine höhere Freigabestufe. Jeder Prüfdurchgang nennt die tatsächlich geprüfte content_revision und semantic_revision; der Compiler gleicht beide mit dem aktuellen Fragedatensatz ab. Eine Änderung ohne erneuerte passende Prüfnachweise darf nicht unbemerkt exportiert werden.

## 4 Stabile Identitäten und Revisionen

id bezeichnet die Frage dauerhaft. fact_key bezeichnet den abgefragten Sachverhalt und verhindert, dass Umformulierungen als neue Wissensinhalte gezählt oder innerhalb derselben Runde doppelt angeboten werden. Ein neuer Wortlaut allein erhält keinen neuen fact_key. Der erste Releasebestand enthält nur eine aktive Frage pro fact_key; spätere Varianten dürfen die ausgewiesene Faktenmenge nicht erhöhen.

Antwort-IDs bleiben innerhalb einer semantischen Version stabil. correct_option_id muss genau einer vorhandenen Antwort-ID entsprechen. Niemals einen wechselnden Array-Index als Wahrheitsschlüssel speichern.

content_revision steigt bei jeder veröffentlichten Text- oder Datenänderung. Eine reine Tippfehlerkorrektur lässt semantic_revision unverändert. Ändern sich Bedeutung, Richtigkeit, wesentliche Erklärung oder Antwortmöglichkeiten, steigen beide Revisionen. Eine neue semantische Version benötigt beide Prüfdurchgänge erneut. Mastery und Wiederholungsvergleiche dürfen unterschiedliche semantische Versionen nicht stillschweigend als denselben geprüften Lernstand behandeln.

Historische Versuchsdaten und aktive Rundensnapshots bleiben unverändert gespeichert. Ein Korrekturmanifest benennt betroffene Frage-IDs und semantische Versionen sowie den Grund. retired entfernt eine Frage aus neuen Auswahlen; retirement dokumentiert Zeitpunkt, tatsächlichen Verantwortlichen und gegebenenfalls einen Ersatz. Historische Records werden nicht gelöscht oder umgeschrieben. Der Releaseexport muss auch bereits ausgelieferte zurückgezogene IDs als separate Sperr- und Korrekturinformationen erhalten.

## 5 Bekannte Sachfehler in begonnenen Runden

Ein bekannt fehlerhafter Snapshot wird nach Eingang der Korrektur zusätzlich als void markiert und neutral übersprungen. Der gespeicherte ursprüngliche Text bleibt erhalten; die Position erzeugt keine Antwortwertung und keinen Wiederholungs- oder Masteryfortschritt. Dasselbe gilt, wenn eine bereits beantwortete Position der noch offenen Runde betroffen ist. Korrekturen sind offline erst nach Installation eines entsprechenden Updates bekannt.

Das Ergebnis zeigt C richtige Antworten von N gültigen Fragen samt Korrekturhinweis. Bei Abschluss gilt Tages-XP = 20 + 10 × C, sofern N mindestens eins ist; bei N = 0 gibt es null XP. Medaillen gibt es nur bei N mindestens acht und anhand von mindestens 50, 70 beziehungsweise 90 Prozent richtigen Antworten. Virtuelle Gegner werden nur bei N = 10 verglichen. Das Wochenziel zählt einen abgeschlossenen Tag nur bei N mindestens eins.

Vor Eingang der Korrektur bereits verbuchte XP bleiben bestehen. Historische Ergebnisse werden als damaliger Stand erhalten und mit einem Korrekturhinweis versehen. Technische Details und Idempotenz richten sich nach den verbindlichen Produktregeln des Pakets. Im Wissensalbum erscheint eine gültige korrigierte Erklärung mit Kennzeichnung oder ein neutraler Prüfhinweis. Bekannte falsche Inhalte dürfen nicht weiter unmarkiert als Wissen erscheinen; historische Auszeichnungen bleiben erhalten.

## 6 Menschliche Erprobung des Referenzbestands

Die 150 Referenzfragen werden tatsächlichen Testpersonen angeboten. Pro wirklich beobachteter Frage werden bei Bedarf Testcharge, pseudonymer Teilnehmercode, Zeitpunkt und Rückmeldung gespeichert. human_test_observations bleibt leer, solange keine solche Beobachtung vorliegt. Ein angebotenes Quiz beweist nicht, dass jede enthaltene Frage gesehen oder verstanden wurde.

Der Testbericht nennt getrennt angebotene Fragen, tatsächlich erreichte Fragen und Rückmeldungen. Keine vollständig menschliche Prüfung behaupten, wenn nur Teile begegnet sind. Echte Alltagserprobung und freiwillige Rückkehr können nicht durch simulierte Testpersonen ersetzt werden. Der Agent arbeitet an unabhängigen Aufgaben weiter, solange externe Tests ausstehen, und hält diesen Gate-Status offen.

## 7 Releasevalidierung und Ausgabe

Der Compiler verwendet JSON Schema Draft 2020-12 mit ausdrücklich aktivierter Formatprüfung für URI, date und date-time. Zusätzlich prüft er global eindeutige IDs, eindeutige Antwort- und Quellen-IDs je Frage, vorhandene Antwortschlüssel, gültige Quellenreferenzen, zeitlich konsistente Prüfprotokolle, nichtleere Texte nach Trimmen und inhaltliche Dubletten. uniqueItems allein ersetzt diese Prüfungen nicht.

Für den Produktionsbestand gelten: nur release_approved, keine offenen Probleme, nicht abgelaufene Gültigkeit, alle Quellen und Prüfungen vollständig sowie exakt die vereinbarte Kategorienabdeckung. Semantische Änderungen dürfen keine alte Freigabe übernehmen. Sachliche Qualität bleibt eine redaktionelle Abnahme und wird nicht durch einen grünen Validator bewiesen.

Die App erhält einen getrennten, schlanken Runtimeexport. Interne Prüferkennungen, pseudonyme Testnotizen und redaktionelle Arbeitsvermerke gehören nicht ins öffentliche Appbundle. Nutzerseitig benötigte Quelleninformationen dürfen enthalten sein. Manifest und Prüfbericht weisen Inhaltsversion, Zahl aktiver Fragen, Zahl verschiedener Fakten, Verteilung, gesperrte Revisionen und tatsächlichen Prüfstatus aus. Beispiel- und Fixture-Inhalte sind ausschließlich Testdaten und dürfen niemals als echte Releasefragen gezählt oder ausgeliefert werden.
