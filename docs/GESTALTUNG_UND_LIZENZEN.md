# Gestaltung und Assetnachweis

Quizsalon verwendet eine lokal gebündelte Salonillustration, einen eigens gezeichneten Buch-Sonnen-Schriftzug und sechs selbst erstellte Themensymbole. Die Bedienoberfläche verwendet DM Sans für Fragen und Antworten und Spectral Medium für die redaktionellen Überschriften.

| Bestandteil | Herkunft und Weitergabe |
| --- | --- |
| web/assets/salon.webp | Für dieses Projekt mit dem eingebauten ImageGen-Werkzeug erzeugt. Das gelieferte Bitmap wurde für das App-Bundle als WebP codiert. |
| web/assets/fonts/DM-Sans.ttf | Offlinekopie der variablen Schrift aus dem Google-Fonts-Repository. Der beigefügte SIL-OFL-Text liegt in web/assets/fonts/DM-Sans-LICENSE.txt. |
| web/assets/fonts/Spectral-Medium.ttf | Offlinekopie von Spectral Medium aus dem Google-Fonts-Repository. Lizenz in web/assets/fonts/Spectral-LICENSE.txt. |
| App-Icon und Feature Graphic | tools/artwork.mjs rendert das projektinterne Markenzeichen und die Salonillustration auf die dokumentierten PNG-Abmessungen. |
| Rückmeldeton | Kurzer lokal synthetisierter Sinuston per Web Audio API. |

Die eigenständige HTML-Datei enthält die Schriftlizenzen im Dokument. Die inhaltlichen Datenquellen und deren Namensnennung stehen bei den Fragen und in den redaktionellen Nachweisen.

### Generierungsauftrag für die Illustration

Use case: illustration-story. Produce the artwork itself, a richly tactile editorial linocut and gouache print for a German grown-up quiz almanac. A full-bleed wide landscape vignette of a cultivated reading salon: a vintage brass terrestrial globe on two stacked clothbound rust and tan books on a small wooden side table in the foreground, the curve of a deep moss-green upholstered reading armchair on the right, behind them a beautiful tall arched mullioned window, sunny warm pale honey light, a dark pine-green wall, leaves of a potted indoor plant on the far left. Deliberately designed, broadly cut shapes overlaid with fine woodcut hatching and tiny speckled paper grain; restrained mid-century European book-cover art. Rich pine green, sage, warm parchment cream, ochre/brass and muted terracotta. Beautifully composed, sophisticated, crisp silhouette of the globe, a sense of calm evening light. Aim for 3:2 landscape aspect. Every inch is artwork. No letters, labels, writing, numbers, logos, border, people or watermark. The lower center is a table and books, not text space.
