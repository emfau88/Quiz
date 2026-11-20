# Eine Frage korrigieren

1. Die gemeldete ID und die semantische Revision mit dem tatsächlich ausgelieferten Katalog abgleichen. Den Sachverhalt in der Quelle prüfen.
2. Für reine Schreibkorrekturen content_revision erhöhen. Bei fachlicher Änderung zusätzlich semantic_revision erhöhen. Die bisherige fehlerhafte semantische Fassung mit ID, Revision und Grund in content/corrections.json aufnehmen. Ein fakultatives replacement_id verweist auf die gültige Ersatzfrage.
3. Beleg, Faktenprüfung und getrennte Redaktionsprüfung mit den neuen Revisionen festhalten. Erst dann den Status release_approved vergeben.
4. Katalogprüfung und Regressionstests ausführen. Der Runtimeexport transportiert die Sperrliste auch dann, wenn die alte Frage aus den aktiven Datensätzen entfernt wurde.
5. Das Update erneut lokal und vor einer Store-Einreichung auf Android prüfen. Aktive Runden erhalten neutrale Positionen. Bereits abgeschlossene Ergebnisse behalten ihre damaligen Punkte. Das Album zeigt die aktuelle geprüfte Erklärung oder einen neutralen Prüfhinweis.

Katalogänderungen werden auf dem Gerät mit der neuen App- bzw. Webfassung wirksam. Eine nur lokal installierte HTML-Datei erhält Updates durch Ersetzen am selben Speicherort. Ein Wechsel des Browserprofils kann einen anderen Spielstand öffnen.
