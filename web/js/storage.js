import {migrate} from './engine.js';
import {profileScope} from './access.js';

const native = globalThis.QuizAndroid;
let db, installId;
const channel = 'BroadcastChannel' in globalThis ? new BroadcastChannel(profileScope + '-changes') : null;

function uid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(profileScope, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('local')) request.result.createObjectStore('local');
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Schließe andere geöffnete Quizsalon-Fenster und versuche es erneut.'));
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}
function browserUpdate(key, change) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('local', 'readwrite', {durability: 'strict'});
    const store = tx.objectStore('local');
    const request = store.get(key);
    let value, cause;
    request.onsuccess = () => {
      try {
        value = change(request.result);
        store.put(value, key);
      } catch (error) {
        cause = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(cause || tx.error || new Error('Der Spielstand konnte nicht gespeichert werden.'));
    tx.onerror = () => { cause ??= tx.error; };
  });
}
export async function initStorage() {
  if (native) installId = native.getInstallationId();
  else {
    db = await openDatabase();
    installId = await browserUpdate('installation', old => old || uid());
  }
  return installId;
}
export async function transact(change) {
  let state;
  if (native) {
    let written = false;
    for (let attempt = 0; attempt < 5 && !written; attempt++) {
      const current = JSON.parse(native.readGame());
      state = migrate(current.value);
      change(state);
      written = native.writeGame(current.rev, JSON.stringify(state));
    }
    if (!written) throw new Error('Der Spielstand wurde gleichzeitig geändert. Versuche es bitte erneut.');
  } else {
    state = await browserUpdate('game', current => {
      const next = migrate(current);
      change(next);
      return next;
    });
  }
  channel?.postMessage('saved');
  return state;
}
export async function readGame() {
  if (native) return migrate(JSON.parse(native.readGame()).value);
  return new Promise((resolve, reject) => {
    const request = db.transaction('local').objectStore('local').get('game');
    request.onsuccess = () => {
      try { resolve(migrate(request.result)); } catch (error) { reject(error); }
    };
    request.onerror = () => reject(request.error);
  });
}
export function onExternalSave(handler) {
  if (channel) channel.onmessage = handler;
}
