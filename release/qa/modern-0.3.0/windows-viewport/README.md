# Mobile Breitenmessung und Offline-Wiederaufnahme unter Windows

Geprüft wurde die fertige unter `/Quiz/` gemountete Pages-Ausgabe 0.3.0 mit dem Katalog `de-d5a1d0585ed1`. Die sieben frischen Profile liefen in Playwrights Windows-WebKit 26.5 oder Chromium 149.0.7827.55. Das sind emulierte Handyprofile. Ein physisches iPhone war an dieser Messung nicht beteiligt.

## Breiten

| Profil | Nominelle Breite | Sichtbarer Bereich | Scrollbreite der Frage | Scrollbreite einer neutralen Referenzseite |
|---|---:|---:|---:|---:|
| WebKit, iPhone 13, drei frische Profile | 390 px | 378,18 px | 391 px | 391 px |
| WebKit, iPhone 13 | 375 px | 363,64 px | 376 px | 376 px |
| WebKit, iPhone 13 | 414 px | 401,45 px | 415 px | 415 px |
| Chromium, Pixel 7 | 360 px | 360 px | 360 px | 360 px |
| Chromium, Pixel 7 | 390 px | 390 px | 390 px | 390 px |

Die neutrale Referenzseite enthielt dieselbe mobile Viewport-Angabe, einen randlosen Body und einen einzelnen Block in natürlicher Breite. Bei 390 px maß Windows-WebKit schon dort 390,79 px Bodybreite, 378,18 px sichtbare Breite und einen maximalen horizontalen Scrollweg von 12 px. In Quizsalon erreichten nur die flächigen Container `#app` und Kopfzeile den rechten Layoutrand. Fragen, Antworttexte und Antwortflächen lagen im sichtbaren Bereich. [Messwerte aller Handyprofile](messungen.json) · [WebKit, 375 px](webkit-375-4.png) · [WebKit, 390 px](webkit-390-2.png) · [Chromium, 360 px](chromium-360-1.png)

Bei 390 px erhöhte ein absichtlich um 4 px verbreiterter Block die Scrollbreite unter WebKit von 391 auf 395 px. Bei 30 px Überbreite ergaben sich 421 px. Chromium meldete die zusätzlichen 4 und 30 px ebenfalls als höhere Scrollbreite und vergrößerte dabei auch `innerWidth`. Der Pages-Test misst deshalb die Scrollbreite gegen die feste, vorgegebene Handybreite mit einem Pixel Rundungsspielraum. Für Frage und Antworten prüft er zusätzlich den sichtbaren Bereich und den Innenraum der einzelnen Elemente. [Vergleichsmessungen mit absichtlich überbreiten Elementen](kontrollen.json)

In einer weiteren WebKit-Prüfung warteten die beiden Schriftanfragen auf eine kontrollierte Freigabe. Bereits bei der ersten bedienbaren Frage betrug die Scrollbreite 391 px. Nach dem Laden von DM Sans und Spectral blieb sie bei 391 px. Der rechte Rand von Frage und Antworten lag in beiden Messungen bei 362,70 px. Die kontrollierte Verzögerung von über drei Sekunden diente der Beobachtung des Schriftwechsels. [Schriftstatus und Zeitmessungen](fontwechsel.json)

## Offline-Vergleich

Der lokale HTTP-Server wurde nach einer beantworteten Frage und aktivem Service Worker tatsächlich geschlossen. Die Adresse für die Wiederaufnahme war vor dem Abschalten noch nie angefordert worden.

| Windows-Szenario | WebKit 26.5, 0.2.0 | WebKit 26.5, 0.3.0 |
|---|---|---|
| Bestehende Seite neu laden | HTTP 200, Antwort wiederhergestellt | HTTP 200, Antwort wiederhergestellt |
| Aus dem laufenden Dokument eine neue Adresse derselben App öffnen | HTTP 200, Antwort wiederhergestellt | HTTP 200, Antwort wiederhergestellt |
| Unbenutzten Tab öffnen, während der ursprüngliche noch existiert | HTTP 200, Antwort wiederhergestellt | HTTP 200, Antwort wiederhergestellt |
| Letztes Ursprungsdokument durch `about:blank` ersetzen, dann neue Adresse öffnen | FetchEvent-Fehler | FetchEvent-Fehler |
| Nach diesem Vorgang die genaue `index.html` oder die Stammadresse aufrufen | FetchEvent-Fehler | FetchEvent-Fehler |

Die beiden flüchtigen Testprofile enthielten vor dem Stopp die Dateien im benannten Cache. Nachdem der letzte Ursprung verlassen worden war, zeigte ein neutrales Dokument auf demselben, wieder gestarteten Ursprung einen benannten Cache ohne Einträge. Separate frische persistente Windows-WebKit-Profile zeigten bei beiden Ausgaben bereits nach der Aktivierung einen leeren Cache. Dieser Befund ist auf die erprobte Windows-Playwright-Umgebung beschränkt. [Vergleich 0.2.0](offline-02-ephemeral-lebensdauer.json) · [Vergleich 0.3.0](offline-03-ephemeral-lebensdauer.json) · [Persistentes Profil 0.2.0](offline-02-persistent.json) · [Persistentes Profil 0.3.0](offline-03-persistent.json)

Im zusätzlichen lokalen WebKit-Spieldurchlauf startete die Offline-Wiederaufnahme in einem frischen Tab. Unmittelbar nach dem Laden der gespeicherten Erklärung wurde der ursprüngliche Tab geschlossen. Die restliche Tagesrunde, die Prüfung der vorgesehenen Frageformen und der Start einer anspruchsvollen Themenrunde liefen anschließend bei abgeschaltetem Server vollständig durch. Unter Windows-Chromium bestand auch der strengere komplette Test mit vorherigem Wechsel zu `about:blank`.

Die verbindliche Prüfung in GitHub Actions enthält weiterhin den Wechsel zu `about:blank` bei abgeschaltetem Server für Chromium und WebKit. Der Linux-Lauf 45080570277 absolvierte den Schritt „Handy-Ansicht und Offline-Wiederaufnahme prüfen“ erfolgreich. [GitHub Actions](https://github.com/emfau88/Quiz/actions/runs/45080570277)
