# Parkly · Gestione parchi

App web installabile (PWA) per la gestione e l'ispezione dei parchi giochi: comuni, parchi, ispezioni e foto. Funziona anche senza rete.

## Contenuto del repository

Questo repository contiene solo la **versione compilata** dell'app, pronta per la pubblicazione (es. GitHub Pages). Il codice sorgente non è qui.

| File | Funzione |
|---|---|
| `index.html` | App compilata (React + Tailwind, minificata) |
| `sw.js` | Service worker: cache di app, foto e risorse statiche per l'uso offline |
| `manifest.webmanifest` | Metadati per l'installazione su telefono |
| `icon-*.png`, `apple-touch-icon.png` | Icone dell'app |

## Pubblicazione

Caricare i file nella radice del repository. L'app deve essere servita via HTTPS perché il service worker funzioni.

## Aggiornamenti offline

`sw.js` tenta prima la rete per la pagina e, dopo 5 secondi senza risposta, usa la copia salvata. Le cache hanno un nome con versione (`parkly-app-v1`, `parkly-foto-v1`, `parkly-statici-v1`): cambiando il numero si eliminano le vecchie cache all'attivazione.
