# Offline-Wiederaufnahme unter Windows

Am 24. November 2026 haben Windows-WebKit 26.5 und Chromium 149.0.7827.55 die Tagesrunde mit abgeschaltetem lokalem HTTP-Server beendet. Beide öffneten eine zuvor unbesuchte Adresse, zeigten dieselbe Frage mit ihrer gespeicherten Antwort und öffneten nach dem zehnten Ergebnis eine anspruchsvolle Themenrunde. Die lokale Pages-Testausgabe hatte 36 Dateien und die Workerkennung `9ae5476a74eae7d0`. [Messwerte zum Kaltstart](kaltstart.json)

| Versuch | Beobachtung |
|---|---|
| Ursprüngliche Versionen 0.3.0 und 0.4.0 | Im dauerhaften Windows-WebKit-Profil scheiterten beide nach dem Schließen des Browsers mit `FetchEvent.respondWith received an error: TypeError: Load failed`. Der Spielstand enthielt weiterhin die erste Antwort. Im ursprünglichen privaten 0.4.0-Profil ließen sich vor dem Verlassen der Seite 36 Cache-Antworten lesen. Danach waren es null. [Ausgangsmessung](ausgangsfehler.json) |
| WebKit, dauerhafte Installation | Nach dem Beenden und erneuten Starten des Browserprozesses waren alle 36 Dateien aus derselben IndexedDB-Version lesbar. Die neue Adresse antwortete mit HTTP 200. Die Schrift war geladen, die vier Antwortknöpfe der bereits beantworteten Frage waren gesperrt. [Kaltstart](kaltstart.json) |
| Chromium, zwei frische Profile | Der private Handytest absolvierte die gesamte Runde. Beim zweiten Versuch wurde das dauerhafte Profil nach vollständigem Prozessende offline wieder geöffnet. Frage, Antwortfeedback und Spielstand stimmten überein. Anschließend ließ sich die nächste Frage öffnen. [Kaltstart](kaltstart.json) |

Der Windows-WebKit-Port stellte keine Speicherquotenabfrage bereit. Im privaten Testprofil konnte eine sofortige Rückkehr aus `about:blank` schon vor dem Laden des neuen Dokuments hängenbleiben. Ein zusätzlicher privater Durchlauf mit 3,1 Sekunden Abstand bestand auch dort die zehn Fragen. Der reguläre Windows-WebKit-Test schließt den gesamten Browser und öffnet dasselbe dauerhafte Profil erneut. Die Messung betrifft die Windows-Laufzeit mit emuliertem Telefon. [Kaltstart](kaltstart.json)

## Abgebrochenes Update und Wiederholung

Für den Versuch wurden zwei Ausgaben in getrennten, frischen Verzeichnissen erstellt. Nur ein Kommentar im Worker änderte sich. Bei identischen App-Dateien ergab sich die neue Workerkennung `0ef679712510e4c6`. Beide Browser verwendeten die normale Registrierungsadresse `./sw.js` und `registration.update()`.

1. Nach der ersten Antwort wurde das bereitgestellte Verzeichnis auf die zweite Ausgabe umgestellt. Das Porträt `assets/guests/nils.png` war vorübergehend entfernt. Der HTTP-Server beantwortete den Abruf mit 404.
2. Der neue Worker erreichte den Zustand `redundant`. Die alte Kennung enthielt weiterhin alle 36 Antworten. In der neuen Kennung war keine Datei freigegeben.
3. Der Server wurde beendet. Die alte Ausgabe öffnete sich mit der gespeicherten Antwort unter einer neuen Adresse.
4. Nach Wiederherstellung des Porträts wurde derselbe Updateversuch wiederholt. Der Worker erreichte `activated`. Ausschließlich die neue Kennung enthielt die 36 Dateien. Bei erneut abgeschaltetem Server ließ sich die gespeicherte Antwort wieder öffnen. Beim WebKit-Versuch wurden für die beiden Offline-Aufrufe die Browserprozesse jeweils vollständig beendet und neu gestartet. [WebKit](atomar-webkit.json) · [Chromium](atomar-chromium.json)

## Kaltstart reproduzieren

Der erste Befehl erzeugt ein neues Pages-Verzeichnis. Für jede Wiederholung einen freien Verzeichnisnamen wählen.

```powershell
node tools/package-web.mjs --pages .cache/offline-nachpruefung/Quiz
node tests/pages-browser.mjs .cache/offline-nachpruefung/Quiz webkit chromium
```
