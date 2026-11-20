# Quizsalon Agentenpaket

Stand 20. November 2026. Dieses Paket enthält den vollständigen Bau- und Abnahmeplan für eine Android-Quiz-App. Es enthält noch keinen App-Code, keinen Fragenbestand, keine App-Builds und keine bereits bestandenen App-Tests.

## Verwendung

1. Das Paket in das Zielrepository oder als Dateien an den Coding-Agenten übergeben.
2. Den Text aus STARTPROMPT.md als Auftrag senden.
3. Der Agent liest den Gesamtplan und die ergänzenden technischen Vorgaben, prüft das Repository und beginnt die Umsetzung.

## Enthaltene Unterlagen

| Datei | Inhalt |
| --- | --- |
| STARTPROMPT.md | Direkter Startauftrag für den umsetzenden Agenten |
| QUIZSALON_UMSETZUNGSPLAN.md | Produktregeln, Architektur, Daten, Phasen und Fertigstellungszustände |
| docs/CONTENT_SPEC.md | Fragenformat, Quellenprüfung, Redaktion und Korrekturen |
| docs/ABNAHME_UND_RELEASE.md | Überprüfbare Funktions-, Inhalts-, Geräte-, Kauf- und Veröffentlichungsgates |
| specs/product_rules.json | Zentrale Regelwerte zur Übernahme in die Implementierung |
| specs/question.schema.json | Schema für redaktionelle Fragen-Quelldateien |

## Geltung

Der Gesamtplan definiert den Produktumfang. Die Content-Spezifikation definiert das redaktionelle Format. Die Abnahmeliste definiert die Nachweise. JSON-Regeln bilden die vereinbarten Zahlen maschinenlesbar ab. Falls ein echter Widerspruch auftritt, dokumentiert und korrigiert der Agent ihn, statt eine still abweichende App zu bauen.

Vorhandene Repository-Anweisungen und Nutzeränderungen bleiben zu beachten. Das Paket ersetzt keine bereits erteilten Zugriffsrechte und stellt keine öffentliche App bereit. Technische Dokumentationsdateien können unverändert als Ausgangspunkt ins Repository übernommen werden.

## Festgelegte Richtung

Flutter, offline spielbarer Kern, 1.200 geprüfte deutsche Fragen, sechs Kategorien, zehn Tagesfragen, maximal zwei fällige Wiederholungen, ehrliche Erfahrung, freiwilliger Computervergleich und ein einmaliger Plus-Kauf. Die Standard-App enthält weder Werbung noch eigene Konten oder Server.

Menschliche Zielgruppentests, reale Play-Kauftests, Signierung und tatsächliche Google-Freigabe sind nachzuweisen. Offene externe Aufgaben werden klar benannt; sie dürfen nicht als erledigt ausgegeben werden.
