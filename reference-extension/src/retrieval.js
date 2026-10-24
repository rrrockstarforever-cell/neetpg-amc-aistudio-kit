// Pure helpers: split attachment text into chunks and pick the most relevant ones for a question.
export const STOP = new Set('a an the of and or to in on for with is are was were be by as at from this that these those it its into what which who whom how why when where does do did can could should would will shall may might than then there their about over under not no yes all any each per vs via i me my we our you your he she they them his her'.split(' '));
export function tokens(t) {
  return (String(t).toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) || []).filter(w => !STOP.has(w));
}
export function chunk(att, size = 1800) {
  const out = [];
  (att.pages || []).forEach((p, i) => {
    const text = String(p || '').trim();
    if (!text) return;
    for (let k = 0; k < text.length; k += size) out.push({ att: att.name, page: i + 1, text: text.slice(k, k + size) });
  });
  return out;
}
export function rank(chunks, query) {
  const q = [...new Set(tokens(query))];
  if (!q.length) return chunks.map(c => ({ ...c, score: 0 }));
  const df = new Map();
  const toks = chunks.map(c => { const t = tokens(c.text); new Set(t).forEach(w => df.set(w, (df.get(w) || 0) + 1)); return t; });
  const N = chunks.length || 1;
  const avg = toks.reduce((a, t) => a + t.length, 0) / N || 1;
  return chunks.map((c, i) => {
    const tf = new Map(); toks[i].forEach(w => tf.set(w, (tf.get(w) || 0) + 1));
    let score = 0;
    for (const w of q) {
      const f = tf.get(w); if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(w) || 0) + 0.5) / ((df.get(w) || 0) + 0.5));
      score += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * toks[i].length / avg));
    }
    return { ...c, score };
  }).sort((a, b) => b.score - a.score);
}
// Returns the context block sent to the model. Small attachments go in whole.
export function buildContext(atts, query, budget = 16000) {
  const all = atts.flatMap(a => chunk(a));
  const total = all.reduce((n, c) => n + c.text.length, 0);
  let picked;
  if (total <= budget) picked = all;
  else {
    picked = []; let used = 0;
    for (const c of rank(all, query)) { if (used + c.text.length > budget) continue; picked.push(c); used += c.text.length; if (used > budget * 0.95) break; }
    picked.sort((a, b) => a.att.localeCompare(b.att) || a.page - b.page);
  }
  return { text: picked.map(c => `[${c.att} p.${c.page}]\n${c.text}`).join('\n\n'), chunks: picked.length, of: all.length };
}

