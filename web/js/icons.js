const paths = {
  today: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3"/>',
  topics: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  book: '<path d="M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 6v14"/>',
  gear: '<path d="m9.8 3-.5 2.1-1.7 1-2.1-.7-2.1 3.5L5 10.3v2l-1.6 1.5 2.1 3.7 2.1-.7 1.7 1 .5 2.2h4.3l.5-2.2 1.7-1 2.1.7 2.1-3.7-1.6-1.5v-2l1.6-1.4-2.1-3.5-2.1.7-1.7-1-.5-2.1z"/><circle cx="12" cy="11.6" r="3"/>',
  nature_animals: '<path d="M4 18C2 10 9 4 21 3c0 12-5 17-13 15m-5 3c3-6 7-10 12-13"/>',
  geography_travel: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M4 9h16M4 15h16"/>',
  everyday_technology: '<path d="M8 15c-2-2-3-3-3-6a7 7 0 1 1 14 0c0 3-1 4-3 6l-1 2H9zM9 20h6m-5 2h4"/>',
  history_discoveries: '<path d="m2 8 10-5 10 5H2zm2 12h16M3 22h18M6 10v8m4-8v8m4-8v8m4-8v8"/>',
  entertainment: '<path d="M9 17V5l11-2v12M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
  language_culture: '<path d="M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 6v14m-7-9 4 1m6-1 4-1"/>',
  pause: '<path d="M8 5v14m8-14v14" stroke-width="2.8"/>',
  check: '<path d="m4.5 12 5 5L20 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 7 4-2 2 3 1-7m3-1 2 7-4-2"/>',
  flag: '<path d="M5 21V3c5-3 9 4 14 0v10c-5 4-9-3-14 0"/>',
  arrowback: '<path d="m14 5-7 7 7 7"/>',
  replay: '<path d="M5 9a8 8 0 1 1 0 7M5 3v6h6"/>',
  spark: '<path d="m12 2 2.4 6.9L21 12l-6.6 2.8L12 22l-2.6-7.2L3 12l6.4-3.1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.3"/>',
  star: '<path d="m12 2 3.1 6.2L22 9.3l-5 5 1.2 7L12 18l-6.2 3.3 1.2-7-5-5 6.9-1.1z"/>',
  bell: '<path d="M4 17h16c-2-2-2.5-5-2.5-8a5.5 5.5 0 0 0-11 0c0 3-.5 6-2.5 8zm5 3a3 3 0 0 0 6 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>'
};
export function icon(name, cls = '') {
  return '<svg aria-hidden="true" focusable="false" class="icon ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.book) + '</svg>';
}
export const logo = '<svg class="brandmark" viewBox="0 0 48 48" aria-hidden="true" fill="none"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path d="M24 4v5m-8-3 2 5M9 10l4 4m19-8-2 5m9-1-4 4"/><path d="M18 18a6 6 0 0 1 12 0"/></g><path stroke-width="2.4" d="M5 19c7-1 13 1 19 6 6-5 12-7 19-6v16c-7 0-13 2-19 7-6-5-12-7-19-7zM24 25v16"/><path stroke-width="1.5" d="M9 25c5 0 9 2 12 5m6 0c3-3 7-5 12-5M9 29c5 0 9 2 12 5m6 0c3-3 7-5 12-5"/></g></svg>';
