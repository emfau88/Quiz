const native = globalThis.QuizAndroid;
export const profileScope = 'quizsalon';
export function themeAccess() {
  let status = {state: 'unavailable'};
  try { if (native) status = JSON.parse(native.billingState()); } catch { /* Remain closed if Play has no readable status. */ }
  const allowed = status.state === 'entitled';
  const messages = {
    unavailable: 'Google Play ist hier nicht verfügbar. Tagesrunde, Kennenlernrunden und Wissensalbum sind kostenlos nutzbar.',
    unknown: 'Der Kaufstatus wird mit Google Play abgeglichen. Du kannst die Abfrage erneut starten.',
    pending: 'Die Zahlung ist ausstehend. Sobald Google Play sie bestätigt, werden die Themenrunden freigeschaltet.',
    entitled: 'Dein dauerhafter Plus-Zugang ist aktiv. Deine Themenrunden funktionieren auch offline.',
    not_entitled: 'Ein einmaliger Kauf schaltet freie Themenrunden und die zusätzliche Schwierigkeitswahl frei.',
    revoked: 'Google Play meldet keinen gültigen Plus-Kauf mehr. Laufende Runden kannst du zu Ende spielen.',
    error: 'Der Abgleich mit Google Play war nicht erfolgreich. Versuche die Wiederherstellung bei bestehender Verbindung erneut.'
  };
  return {allowed, label:'Quizsalon Plus', topicLabel:'Themenrunde mit Plus', state:status.state,
    description:'Mit einem einmaligen Kauf spielst du beliebig viele Themenrunden aus dem vorhandenen Fragenbestand.',
    message:status.message || messages[status.state] || messages.error, price:status.price || '',
    canPurchase:Boolean(native && ['not_entitled','revoked'].includes(status.state) && status.price),
    canRestore:Boolean(native)};
}
