import {currentQuestions} from './subtopics.js';

const publicPage = 'https://emfau88.github.io/Quiz/spielen.html';
const route = '#freunde';
const version = '1';
const size = 5;
const invalid = (message = 'Dieser Freundeslink ist unvollständig oder beschädigt.') => ({status: 'invalid', message});
const noLongerCurrent = 'Mindestens eine der fünf Fragen ist in der eingeladenen Fassung nicht mehr spielbar.';

function packCard(card) {
  // Escape the two separators as well. encodeURIComponent otherwise leaves them literal.
  const id = encodeURIComponent(card.id).replace(/[!~]/g, ch => ch === '!' ? '%21' : '%7E');
  return [id, card.content_revision, card.semantic_revision, card.order].join('~');
}

function checkedInvitation(score, cards) {
  if (!Number.isInteger(score) || score < 0 || score > size || !Array.isArray(cards) || cards.length !== size) return null;
  const ids = new Set();
  for (const card of cards) {
    if (!card || typeof card.id !== 'string' || !card.id.trim() || ids.has(card.id) ||
        !Number.isSafeInteger(card.semantic_revision) || card.semantic_revision < 1 ||
        !Number.isSafeInteger(card.content_revision) || card.content_revision < card.semantic_revision ||
        typeof card.order !== 'string' || !/^[0-3]{4}$/.test(card.order) || new Set(card.order).size !== 4) return null;
    ids.add(card.id);
  }
  // A different claimed score cannot book the same five answers a second time on this device.
  try {
    const key = 'friend-' + cards.map(packCard).join('!');
    return {status: 'valid', key, score, cards};
  } catch {
    return null;
  }
}

export function parseFriendLink(hashOrURL) {
  let hash;
  if (typeof hashOrURL === 'string') {
    const start = hashOrURL.indexOf('#');
    hash = start < 0 ? '' : hashOrURL.slice(start);
  } else {
    hash = hashOrURL?.hash;
  }
  if (typeof hash !== 'string' || (hash !== route && !hash.startsWith(route + '/'))) return null;
  const parts = hash.split('/', size + 4);
  if (parts[1] && parts[1] !== version) return invalid('Diese Version des Freundeslinks wird von dieser Quizsalon-Ausgabe nicht unterstützt.');
  if (parts.length !== size + 3 || !/^[0-5]$/.test(parts[2])) return invalid();
  try {
    const cards = [];
    for (const token of parts.slice(3)) {
      const fields = token.split('~', 5);
      if (fields.length !== 4 || !/^[1-9]\d*$/.test(fields[1]) || !/^[1-9]\d*$/.test(fields[2])) return invalid();
      const card = {id: decodeURIComponent(fields[0]), content_revision: Number(fields[1]),
        semantic_revision: Number(fields[2]), order: fields[3]};
      if (packCard(card) !== token) return invalid();
      cards.push(card);
    }
    return checkedInvitation(Number(parts[2]), cards) || invalid();
  } catch {
    return invalid();
  }
}

function optionIds(q) {
  const ids = q.options.map(o => o.id).sort();
  return ids.length === 4 && new Set(ids).size === 4 ? ids : null;
}

function resolveCards(state, catalog, day, invitation) {
  const wanted = new Set(invitation.cards.map(card => card.id)), available = new Map();
  for (const q of currentQuestions(state, catalog, day)) {
    if (!wanted.has(q.id)) continue;
    if (available.has(q.id)) return null;
    available.set(q.id, q);
  }
  const facts = new Set(), items = [];
  for (const card of invitation.cards) {
    const q = available.get(card.id);
    if (!q || q.content_revision !== card.content_revision || q.semantic_revision !== card.semantic_revision ||
        facts.has(q.fact_key)) return null;
    const ids = optionIds(q);
    if (!ids) return null;
    facts.add(q.fact_key);
    const progress = state.progress[q.id + '@' + q.semantic_revision];
    const kind = !progress ? 'new' : (progress.due <= day ? 'due' : 'review');
    // The four digits index sorted stable option IDs, independently of incidental catalog order.
    items.push({q: JSON.parse(JSON.stringify(q)), order: [...card.order].map(position => ids[Number(position)]),
      kind, answer: null, void: false});
  }
  return items;
}

export function friendLinkFor(session, state, catalog, day) {
  if (session?.mode !== 'quick' || session.status !== 'completed' || session.corrected ||
      session.result?.valid !== size || session.items.length !== size) return null;
  const cards = [];
  let score = 0;
  for (const item of session.items) {
    const ids = optionIds(item.q);
    if (item.void || !ids || !item.answer || !ids.includes(item.answer.optionId) ||
        item.answer.correct !== (item.answer.optionId === item.q.correct_option_id) ||
        item.order.length !== 4 || !item.order.every(id => ids.includes(id))) return null;
    if (item.answer.correct) score++;
    cards.push({id: item.q.id, content_revision: item.q.content_revision, semantic_revision: item.q.semantic_revision,
      order: item.order.map(id => ids.indexOf(id)).join('')});
  }
  if (session.result.correct !== score) return null;
  const invitation = checkedInvitation(score, cards);
  if (!invitation || !resolveCards(state, catalog, day, invitation)) return null;
  return publicPage + [route, version, String(score), ...cards.map(packCard)].join('/');
}

export function prepareFriendRound(state, catalog, day, invitation) {
  if (invitation?.status !== 'valid') return invitation?.status === 'invalid' ? invitation : invalid();
  const verified = checkedInvitation(invitation.score, invitation.cards);
  if (!verified || verified.key !== invitation.key) return invalid();
  const {key, score} = verified;
  const saved = state.sessions[key];
  if (saved?.mode === 'friend') {
    return {status: 'existing', key, score: saved.friendScore ?? score, sessionId: saved.id, sessionStatus: saved.status};
  }
  const items = resolveCards(state, catalog, day, verified);
  if (!items) return invalid(noLongerCurrent);
  const ids = new Set(items.map(({q}) => q.id)), facts = new Set(items.map(({q}) => q.fact_key));
  const active = Object.values(state.sessions).filter(s => s.status === 'active');
  const daily = active.find(s => s.mode === 'daily' && s.items.some(({q}) => ids.has(q.id) || facts.has(q.fact_key)));
  if (daily) return {status: 'conflict', code: 'DAILY_CONFLICT', sessionId: daily.id,
    message: 'Deine offene Tagesrunde reserviert eine Frage aus dieser Einladung.'};
  const other = active.find(s => s.mode !== 'daily');
  if (other) return {status: 'conflict', code: 'ACTIVE_TOPIC', sessionId: other.id,
    message: 'Du hast eine andere Zusatzrunde offen. Du kannst sie fortsetzen oder im Verlauf aufgeben.'};
  return {status: 'ready', key, score, items, isReview: items.some(item => item.kind === 'review')};
}
