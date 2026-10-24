// Persistence: chats and rules in localStorage, attachment text in IndexedDB.
export const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
export let dbp = null;
export function db() {
  return dbp ??= new Promise((res, rej) => {
    const q = indexedDB.open('amc-ext', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('atts', { keyPath: 'id' });
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
export async function putAtt(a) { const d = await db(); return new Promise((r, j) => { const t = d.transaction('atts', 'readwrite'); t.objectStore('atts').put(a); t.oncomplete = () => r(a); t.onerror = () => j(t.error); }); }
export async function getAtt(id) { const d = await db(); return new Promise((r, j) => { const q = d.transaction('atts').objectStore('atts').get(id); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); }); }
export async function delAtt(id) { const d = await db(); return new Promise(r => { const t = d.transaction('atts', 'readwrite'); t.objectStore('atts').delete(id); t.oncomplete = r; }); }
// Rules / profiles / boost with an undo history.
export function patterns() { return LS.get('amc.patterns', { rules: [], profiles: [], boost: 0 }); }
export function savePatterns(p, label) {
  const hist = LS.get('amc.patterns.hist', []);
  hist.push({ ts: Date.now(), label, before: patterns() });
  LS.set('amc.patterns.hist', hist.slice(-30));
  LS.set('amc.patterns', p);
}
export function undoPatterns() {
  const hist = LS.get('amc.patterns.hist', []); const last = hist.pop();
  if (!last) return null;
  LS.set('amc.patterns', last.before); LS.set('amc.patterns.hist', hist); return last.label;
}

