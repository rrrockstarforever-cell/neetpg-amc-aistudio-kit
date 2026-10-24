import { LS, putAtt, getAtt, patterns, savePatterns, undoPatterns } from './store.js';
import { buildContext } from './retrieval.js';
import { extractRules, normProfile, profileText, detectExam } from './rules.js';
import { readFile } from './files.js';
// Chat screen: talk to any signed-in model, attach files, teach pattern rules.





export const S = { chats: null, cur: null, sel: [], models: [], tray: [], busy: {}, status: '', el: null, panel: false, pending: {}, lib: null, err: '' };
export const EXN = { neet: 'NEET PG', ini: 'INI-CET', amc: 'AMC', all: 'All exams' };
export const TGN = { mcq: 'Questions', notes: 'Notes', all: 'Everything' };

export function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'className') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
export const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function md(src) {
  const lines = String(src).replace(/\r/g, '').split('\n'); let out = '', list = null, i = 0;
  const inl = t => esc(t).replace(/\[\[(\d+)\]\]\((https?:\/\/[^)\s]+)\)/g, '<a class="cx-src" target="_blank" rel="noopener" href="$2">[$1]</a>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a target="_blank" rel="noopener" href="$2">$2</a>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').replace(/\[([^\]]+ p\.\d+[^\]]*)\]/g, '<span class="cx-cite">$1</span>');
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { close(); let b = ''; i++; while (i < lines.length && !/^```/.test(lines[i])) b += lines[i++] + '\n'; out += `<pre><button class="cx-copycode" type="button">Copy</button><code>${esc(b)}</code></pre>`; i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      close(); const row = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      out += '<table><thead><tr>' + row(l).map(c => `<th>${inl(c)}</th>`).join('') + '</tr></thead><tbody>'; i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) out += '<tr>' + row(lines[i++]).map(c => `<td>${inl(c)}</td>`).join('') + '</tr>';
      out += '</tbody></table>'; continue;
    }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { close(); out += `<h${m[1].length + 2}>${inl(m[2])}</h${m[1].length + 2}>`; }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inl(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inl(m[1])}</li>`; }
    else if (!l.trim()) close();
    else { close(); out += `<p>${inl(l)}</p>`; }
    i++;
  }
  close(); return out;
}

export function B() { return window.__amcBridge; }
export function chats() { return S.chats ??= LS.get('amc.chats', []); }
export function saveChats() { const c = chats().slice(0, 60); try { LS.set('amc.chats', c); } catch { c.forEach(x => x.msgs = x.msgs.slice(-40)); LS.set('amc.chats', c); } }
export function curChat() { return chats().find(c => c.id === S.cur) || null; }
export function newChat() { const c = { id: Date.now(), title: 'New chat', msgs: [], atts: [], ts: Date.now() }; chats().unshift(c); S.cur = c.id; saveChats(); return c; }

export async function loadModels() {
  const b = B(); if (!b) return [];
  let st = {}; try { st = await (await fetch('/api/oauth/status')).json(); } catch {}
  try { await b.loadCatalog(); } catch {}
  const set = b.id(); const out = [];
  for (const p of b.providers()) {
    const raw = set.configs[p.id];
    let ok = false;
    if (p.kind === 'oauth') ok = !!st[p.sub];
    else if (raw) ok = p.needsKey ? !!raw.apiKey && raw.apiKey !== 'oauth' : !!raw.baseUrl;
    if (!ok) continue;
    const cfg = b.od(set, p.id);
    out.push({ id: p.id, dev: p.dev, name: p.name.replace(/ \(.*\)$/, ''), model: LS.get('amc.chat.model.' + p.id, '') || cfg.model || '', cfg });
  }
  S.models = out;
  const saved = LS.get('amc.chat.sel', null);
  S.sel = (saved || [set.active]).filter(id => out.some(m => m.id === id));
  if (!S.sel.length && out.length) S.sel = [out[0].id];
  return out;
}

export function sysPrompt(exam) {
  return `You are a study assistant inside a medical exam prep app (NEET PG, INI-CET and the Australian AMC CAT MCQ exam). The student's current focus is ${EXN[exam]}.
- Be accurate and exam-focused. Keep drug names, eponyms and medical terms in English. Never invent doses, values or references.
- When attached-file excerpts are given, base the answer on them and cite like [file name p.N] after each point taken from them. Mark points that come from your own knowledge as (general knowledge).
- Use short headings, bullet points and tables where they help. When asked for MCQs, follow the real ${EXN[exam]} pattern and give the answer and a short explanation for each.
- When 'Library excerpts' or 'MCQ bank' blocks are supplied they come from the student's own imported books and question banks: use them first and cite as [book name p.N]. If the block says nothing matched, say so plainly and do not invent book content; anything else must be marked (general knowledge).
- If the student states a lasting preference about how the app should write questions or notes in future (format, difficulty, style, topics to stress, things to avoid), answer normally and add ONE line at the very end exactly in this form:
<<RULE scope="neet|ini|amc|all" target="mcq|notes|all">the preference as a clear instruction<</RULE>>
Only do this for lasting preferences, not one-off requests.`;
}

export async function attsText(chat) {
  const list = [];
  for (const a of chat.atts) { const r = await getAtt(a.id); if (r) list.push(r); }
  return list;
}

export function historyFor(chat, modelId) {
  const msgs = [];
  for (const m of chat.msgs) {
    if (m.role === 'user') msgs.push({ role: 'user', content: m.content });
    else if (m.role === 'assistant') {
      const prev = msgs[msgs.length - 1];
      const mine = m.replies.find(r => r.model === modelId && r.text) || m.replies.find(r => r.text);
      if (prev && prev.role === 'user' && mine) msgs.push({ role: 'assistant', content: mine.text });
    }
  }
  while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
  return msgs.slice(-16);
}

export async function send(text) {
  if (/^\s*\//.test(text) && await slash(text)) return;
  const b = B(); let chat = curChat() || newChat();
  if (!S.sel.length) { S.err = 'Pick at least one model at the top.'; render(); return; }
  if (!text.trim() && !S.tray.length) return;
  S.err = '';
  for (const t of S.tray) chat.atts.push(t);
  const added = S.tray.map(t => t.name); S.tray = [];
  if (!text.trim()) text = 'Summarise the attached file' + (added.length > 1 ? 's' : '') + ' for exam revision.';
  chat.msgs.push({ role: 'user', content: text, atts: added, ts: Date.now() });
  if (chat.title === 'New chat') chat.title = text.slice(0, 48);
  const turn = { role: 'assistant', ts: Date.now(), replies: S.sel.map(id => ({ model: id, text: '', busy: true })) };
  S.gen = true; S.ac = new AbortController();
  chat.msgs.push(turn); saveChats(); render();
  const exam = detectExam(chat.msgs.filter(m => m.role === 'user'), b.exam());
  const atts = await attsText(chat);
  const ctx = atts.length ? buildContext(atts, text + ' ' + (chat.msgs.filter(m => m.role === 'user').slice(-2, -1)[0]?.content || '')) : null;
  let lib = null; if (S.useLib) { try { lib = await libContext(text); } catch {} }
  await Promise.all(turn.replies.map(async rep => {
    const m = S.models.find(x => x.id === rep.model);
    try {
      if (!m || !m.model) throw Error(`No model name set for ${m ? m.name : rep.model}. Type one in the model box above.`);
      const hist = historyFor(chat, rep.model);
      const last = hist[hist.length - 1];
      if (ctx && last) last.content = `Attached files (${ctx.chunks === ctx.of ? 'full text' : `${ctx.chunks} most relevant of ${ctx.of} passages`}):\n${ctx.text}\n\n---\nStudent: ${last.content}`;
      if (lib && last) last.content = lib.block + '\n\n' + last.content;
      const out = await b.fd(hist, { system: sysPrompt(exam), effort: effortNow(), search: !!(S.search || S.forceSearch) && isXai(m), signal: S.ac.signal, pin: { id: m.id, config: { ...m.cfg, model: m.model }, label: m.name } });
      if ((S.search || S.forceSearch) && !isXai(m)) rep.note = 'Web search needs the Grok subscription. This reply used no web access.';
      const { text: clean, rules } = extractRules(out);
      rep.text = clean; rep.sources = lib ? lib.src : []; rep.rules = rules.map(r => ({ ...r, state: 'ask' }));
    } catch (e) { rep.error = e.name === 'AbortError' ? 'Stopped.' : e.message; }
    rep.busy = false; rep.at = Date.now(); saveChats(); render();
  }));
  S.gen = false; S.ac = null; render();
}

export async function addFiles(fileList) {
  const b = B();
  for (const f of [...fileList]) {
    const key = 'f' + Date.now() + Math.random();
    S.busy[key] = 'Reading ' + f.name + '…'; render();
    const release = b.hold();
    try {
      const r = await readFile(f, b, s => { S.busy[key] = s; render(); });
      const chars = r.pages.reduce((n, p) => n + (p || '').length, 0);
      if (chars < 20) throw Error(f.name + ': no readable text found.');
      const att = { id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, ''), kind: r.kind, pages: r.pages, chars, ocr: r.ocr || 0 };
      await putAtt(att);
      S.tray.push({ id: att.id, name: att.name, kind: att.kind, pages: r.pages.length, chars, ocr: att.ocr });
    } catch (e) { S.err = e.message; }
    finally { release(); delete S.busy[key]; render(); }
  }
}

export async function addLibrary(doc) {
  const pages = (await B().be(doc.id)).map(p => p.text || '');
  const att = { id: 'L' + doc.id + '-' + Date.now(), name: doc.name, kind: 'library', pages, chars: pages.reduce((n, p) => n + p.length, 0) };
  await putAtt(att);
  S.tray.push({ id: att.id, name: att.name, kind: 'library', pages: pages.length, chars: att.chars });
  S.lib = null; render();
}

export async function learnPattern(attRef, exam) {
  const b = B(), chat = curChat(); const m = S.models.find(x => x.id === S.sel[0]);
  if (!m) { S.err = 'Pick a model first.'; render(); return; }
  const a = await getAtt(attRef.id); const text = a.pages.join('\n').slice(0, 40000);
  const turn = { role: 'assistant', ts: Date.now(), kind: 'profile', replies: [{ model: m.id, busy: true, text: '' }] };
  chat.msgs.push({ role: 'user', content: `Learn the question pattern and difficulty from “${a.name}” (${EXN[exam]}).`, ts: Date.now() });
  chat.msgs.push(turn); saveChats(); render();
  const rep = turn.replies[0];
  try {
    const prompt = `Below are sample multiple-choice questions (they may include answers and explanations, and OCR errors). Analyse them as an exam-question writer would, so that new questions can copy their pattern and difficulty. Count only real questions.
Return ONLY JSON:
{"name": short name for this set, "exam": "neet"|"ini"|"amc"|"all", "count": number of questions analysed,
 "format": {"options": usual number of options, "stem": one sentence on stem length and structure, "lead_ins": [up to 6 typical final questions, e.g. "What is the next best step in management?"]},
 "mix": {"clinical vignette": %, "one-liner recall": %, "image based": %, "multiple statements": %, "match the following": %, "assertion-reason": %, "calculation": %, "other": %},
 "difficulty": {"easy": %, "medium": %, "hard": %, "notes": what makes the hard ones hard},
 "distractors": one or two sentences on how wrong options are built,
 "style_rules": [5-8 short imperative rules a question writer must follow to match this set]}
Percentages are of the questions analysed and each group sums to 100.

SAMPLE (${a.name}):
${text}`;
    const raw = await b.fd([{ role: 'user', content: prompt }], { json: true, noRules: true, pin: { id: m.id, config: { ...m.cfg, model: m.model }, label: m.name } });
    rep.profile = normProfile(b.yd(raw), a.name, exam); rep.profile.state = 'ask';
    rep.text = `**Pattern learned from ${rep.profile.count || 'the'} sample questions in “${a.name}”.** Review it below and save it to use it when the app writes ${EXN[rep.profile.exam]} questions.`;
  } catch (e) { rep.error = e.message; }
  rep.busy = false; saveChats(); render();
}

export function decideRule(rep, r, ok) {
  if (ok) { const p = patterns(); p.rules.push({ id: Date.now(), scope: r.scope, target: r.target, text: r.text, on: true, ts: Date.now() }); savePatterns(p, 'Added rule: ' + r.text.slice(0, 40)); }
  r.state = ok ? 'saved' : 'dismissed'; saveChats(); render();
}
export function decideProfile(rep, ok) {
  const pr = rep.profile;
  if (ok) { const p = patterns(); const { state, ...clean } = pr; p.profiles.push(clean); savePatterns(p, 'Added pattern: ' + pr.name); }
  pr.state = ok ? 'saved' : 'dismissed'; saveChats(); render();
}

export function modelBar() {
  if (!S.models.length) return h('div', { className: 'alert' }, 'No signed-in models found. Open Settings and sign in to ChatGPT, Claude or Grok, or add an API key.');
  return h('div', { className: 'cx-models' },
    h('span', { className: 'muted small' }, S.sel.length > 1 ? `Comparing ${S.sel.length} models` : 'Model'),
    ...S.models.map(m => {
      const on = S.sel.includes(m.id);
      return h('div', { className: 'cx-mchip' + (on ? ' on' : '') },
        h('label', null, h('input', { type: 'checkbox', checked: on, onChange: () => { S.sel = on ? S.sel.filter(x => x !== m.id) : [...S.sel, m.id]; LS.set('amc.chat.sel', S.sel); render(); } }), m.name),
        on && modelSelect(m));
    }));
}


export function modelSelect(m) {
  const list = (B().catalog(m.dev) || []).slice(0, 60);
  const seen = new Set(list.map(x => x.id));
  const opts = [...(m.model && !seen.has(m.model) ? [{ id: m.model, name: m.model }] : []), ...list];
  const sel = h('select', { className: 'cx-mname', title: 'Model used for this provider in chat', onChange: e => {
    let v = e.target.value;
    if (v === '__other') { v = (prompt('Type the model name exactly as the provider calls it:', m.model || '') || '').trim(); if (!v) { render(); return; } }
    m.model = v; LS.set('amc.chat.model.' + m.id, v); render();
  } },
    ...(!m.model ? [h('option', { value: '' }, 'Choose a model…')] : []),
    ...opts.map(o => h('option', { value: o.id }, o.name && o.name !== o.id ? `${o.name} (${o.id})` : o.id)),
    h('option', { value: '__other' }, 'Other…'));
  sel.value = m.model || '';
  return sel;
}

export function attChip(t, inTray) {
  const exam = detectExam([], B().exam());
  return h('span', { className: 'cx-att' }, h('b', null, { pdf: '📄', image: '🖼', docx: '📝', text: '📃', library: '📚' }[t.kind] || '📎'), ' ', t.name,
    h('span', { className: 'muted small' }, ` · ${t.pages} ${t.kind === 'image' ? 'image' : 'pages'}${t.ocr ? ` · OCR ${t.ocr}` : ''}`),
    !inTray && h('button', { className: 'link small', title: 'Analyse these sample questions and save their pattern and difficulty', onClick: () => { const ex = prompt('Which exam is this sample from? Type neet, ini, amc or all.', exam); if (ex && EXN[ex.trim().toLowerCase()]) learnPattern(t, ex.trim().toLowerCase()); } }, 'Learn pattern'),
    inTray && h('button', { className: 'icon-btn', onClick: () => { S.tray = S.tray.filter(x => x !== t); render(); } }, '✕'));
}

export function replyView(rep, many) {
  const m = S.models.find(x => x.id === rep.model);
  return h('div', { className: 'cx-reply' + (many ? ' many' : '') },
    h('div', { className: 'cx-who' }, m ? `${m.name} · ${m.model}` : rep.model),
    rep.busy ? h('div', { className: 'cx-typing' }, h('span'), h('span'), h('span')) :
      rep.error ? h('div', { className: 'alert error' }, rep.error) :
        h('div', { className: 'cx-md selectable', html: md(rep.text), onClick: citeClick }),
    rep.imgId ? imgView(rep.imgId) : null,
    rep.note ? h('div', { className: 'muted small' }, rep.note) : null,
    !rep.busy && rep.text && h('div', { className: 'cx-tools' }, h('button', { className: 'link small', onClick: () => navigator.clipboard.writeText(rep.text) }, 'Copy'), ...srcChips(rep)),
    ...(rep.rules || []).map(r => h('div', { className: 'cx-rule ' + r.state },
      h('div', { className: 'small' }, h('b', null, r.state === 'saved' ? '✓ Saved pattern rule' : r.state === 'dismissed' ? 'Rule dismissed' : 'Save this as a pattern rule?'), ` · ${EXN[r.scope]} · ${TGN[r.target]}`),
      h('div', null, r.text),
      r.state === 'ask' && h('div', { className: 'row' }, h('button', { className: 'btn primary small', onClick: () => decideRule(rep, r, true) }, 'Save rule'), h('button', { className: 'btn small', onClick: () => decideRule(rep, r, false) }, 'Dismiss')))),
    rep.profile && h('div', { className: 'cx-rule ' + rep.profile.state },
      h('div', { className: 'small' }, h('b', null, rep.profile.state === 'saved' ? '✓ Pattern saved' : rep.profile.state === 'dismissed' ? 'Pattern discarded' : 'Learned pattern'), ` · ${EXN[rep.profile.exam]} · ${rep.profile.name}`, rep.profile.count < 15 ? h('span', { className: 'cx-warn' }, ` · only ${rep.profile.count} questions, treat as tentative`) : ''),
      h('pre', { className: 'cx-prof' }, profileText(rep.profile)),
      rep.profile.difficulty?.notes && h('div', { className: 'muted small' }, 'Hard questions: ' + rep.profile.difficulty.notes),
      rep.profile.state === 'ask' && h('div', { className: 'row' }, h('button', { className: 'btn primary small', onClick: () => decideProfile(rep, true) }, 'Save pattern'), h('button', { className: 'btn small', onClick: () => decideProfile(rep, false) }, 'Discard'))));
}

export function patternsPanel() {
  const p = patterns(); const hist = LS.get('amc.patterns.hist', []);
  const upd = (label, fn) => { const q = patterns(); fn(q); savePatterns(q, label); render(); };
  let draft = { scope: 'all', target: 'mcq', text: '' };
  return h('div', { className: 'cx-panel' },
    h('div', { className: 'cx-ph' }, h('h3', null, 'Patterns the app has learned'), h('button', { className: 'icon-btn', onClick: () => { S.panel = false; render(); } }, '✕')),
    h('p', { className: 'muted small' }, 'These are added to every question and notes request (Practice, Reader, Ask your books and Chat). Teach new rules by telling the chat, or add them here.'),
    h('div', { className: 'cx-sec' }, h('b', null, 'Question difficulty'),
      h('select', { onChange: e => upd('Difficulty boost ' + e.target.value, q => q.boost = +e.target.value) }, ...['Exam level', 'Harder than the exam', 'Well beyond exam level', 'Hardest (topper level)'].map((l, i) => { const o = h('option', { value: i }, l); if (i === (p.boost || 0)) o.selected = true; return o; })),
      h('div', { className: 'muted small' }, 'Above exam level, questions add reasoning steps and closer distractors, stay inside the syllabus, and are tagged “Beyond exam level”.')),
    h('div', { className: 'cx-sec' }, h('b', null, `Rules (${p.rules.length})`),
      p.rules.length ? null : h('div', { className: 'muted small' }, 'No rules yet. Try telling the chat: “For INI-CET, always include two multiple-statement questions.”'),
      ...p.rules.map(r => h('div', { className: 'cx-ritem' + (r.on === false ? ' off' : '') },
        h('label', null, h('input', { type: 'checkbox', checked: r.on !== false, onChange: () => upd((r.on === false ? 'Enabled' : 'Disabled') + ' rule', q => { const x = q.rules.find(y => y.id === r.id); x.on = x.on === false; }) })),
        h('div', null, h('div', null, r.text), h('div', { className: 'muted small' }, `${EXN[r.scope]} · ${TGN[r.target]}`)),
        h('button', { className: 'icon-btn', title: 'Delete', onClick: () => upd('Deleted rule', q => q.rules = q.rules.filter(y => y.id !== r.id)) }, '🗑'))),
      h('div', { className: 'cx-add' },
        h('select', { onChange: e => draft.scope = e.target.value }, ...Object.entries(EXN).reverse().map(([k, v]) => h('option', { value: k }, v))),
        h('select', { onChange: e => draft.target = e.target.value }, ...Object.entries(TGN).map(([k, v]) => h('option', { value: k }, v))),
        h('input', { placeholder: 'New rule, e.g. Avoid “all of the above” options', onInput: e => draft.text = e.target.value }),
        h('button', { className: 'btn small', onClick: () => { if (draft.text.trim()) upd('Added rule', q => q.rules.push({ id: Date.now(), ...draft, text: draft.text.trim(), on: true, ts: Date.now() })); } }, 'Add'))),
    h('div', { className: 'cx-sec' }, h('b', null, `Learned patterns (${p.profiles.length})`),
      p.profiles.length ? null : h('div', { className: 'muted small' }, 'Attach sample MCQs or previous-year papers in the chat, then press “Learn pattern” on the file.'),
      ...p.profiles.map(pr => h('details', { className: 'cx-ritem' + (pr.on === false ? ' off' : '') },
        h('summary', null, h('input', { type: 'checkbox', checked: pr.on !== false, onClick: e => e.stopPropagation(), onChange: () => upd('Toggled pattern', q => { const x = q.profiles.find(y => y.id === pr.id); x.on = x.on === false; }) }), ` ${pr.name} · ${EXN[pr.exam]} · ${pr.count} questions`),
        h('pre', { className: 'cx-prof' }, profileText(pr)),
        h('button', { className: 'link small', onClick: () => upd('Deleted pattern', q => q.profiles = q.profiles.filter(y => y.id !== pr.id)) }, 'Delete pattern')))),
    h('div', { className: 'cx-sec' }, h('b', null, 'Import a pattern file'),
      h('div', { className: 'muted small' }, 'Load a learned pattern saved as .json (for example one that Hermes prepared from your recall PDFs).'),
      h('input', { type: 'file', accept: '.json', onChange: async e => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const j = JSON.parse(await f.text()); const list = (Array.isArray(j) ? j : [j]).filter(x => x && x.format && x.name);
          if (!list.length) throw Error('This file has no pattern in it.');
          upd('Imported ' + list.length + ' pattern(s)', q => list.forEach(x => q.profiles.push({ ...x, id: Date.now() + Math.random(), on: true })));
          S.status = 'Imported ' + list.length + ' pattern(s).';
        } catch (err) { S.err = 'Import failed: ' + err.message; render(); }
      } })),
    hist.length ? h('div', { className: 'cx-sec' }, h('button', { className: 'btn small', onClick: () => { const l = undoPatterns(); S.status = l ? 'Undid: ' + l : ''; render(); } }, '↶ Undo last change'), h('span', { className: 'muted small' }, '  Last: ' + hist[hist.length - 1].label)) : null);
}

export function render() {
  const root = S.el; if (!root || !root.isConnected) return;
  const ta = root.querySelector('textarea'); const draft = ta ? ta.value : (S.draft || '');
  const keepScroll = root.querySelector('.cx-msgs'); const atBottom = !keepScroll || keepScroll.scrollHeight - keepScroll.scrollTop - keepScroll.clientHeight < 80;
  const chat = curChat();
  const fileIn = h('input', { type: 'file', multiple: true, accept: '.pdf,.docx,.txt,.md,.csv,.json,image/*', style: 'display:none', onChange: e => { addFiles(e.target.files); e.target.value = ''; } });
  const sendNow = () => { const t = root.querySelector('textarea'); const v = t.value; t.value = ''; S.draft = ''; send(v); };
  const view = h('div', { className: 'cx' },
    h('aside', { className: 'cx-side' },
      h('button', { className: 'btn primary', onClick: () => { newChat(); S.tray = []; render(); } }, '+ New chat'),
      h('button', { className: 'btn', onClick: () => { S.panel = !S.panel; render(); } }, '🧠 Patterns' + (patterns().rules.length + patterns().profiles.length ? ` (${patterns().rules.length + patterns().profiles.length})` : '')),
      chatList()),
    h('section', { className: 'cx-main', onDragover: e => { e.preventDefault(); root.querySelector('.cx-main').classList.add('drop'); }, onDragleave: () => root.querySelector('.cx-main').classList.remove('drop'), onDrop: e => { e.preventDefault(); root.querySelector('.cx-main').classList.remove('drop'); addFiles(e.dataTransfer.files); } },
      !S.models.length && h('div', { className: 'alert' }, 'No signed-in models found. Open Settings and sign in to ChatGPT, Claude or Grok, or add an API key.'),
      h('div', { className: 'cx-msgs' },
        !chat || !chat.msgs.length ? h('div', { className: 'cx-empty' }, h('h2', null, 'Chat with your AI models'), h('p', { className: 'muted' }, 'Drop PDFs, Word files, images or text here, or attach books from your Library. Ask anything, compare models side by side, and teach the app how you want questions and notes written.'),
          h('div', { className: 'cx-sugg' }, ...['Make 10 INI-CET MCQs on the attached chapter', 'From now on, NEET questions should be mostly clinical vignettes', 'Compare the management of PPH in India and Australia'].map(t => h('button', { className: 'cx-chip', onClick: () => { root.querySelector('textarea').value = t; } }, t)))) :
          chat.msgs.map((m, mi) => msgView(chat, m, mi))),
      S.err && h('div', { className: 'alert error cx-err' }, S.err, h('button', { className: 'icon-btn', onClick: () => { S.err = ''; render(); } }, '✕')),
      Object.values(S.busy).length ? h('div', { className: 'muted small cx-busy' }, Object.values(S.busy).join(' · '), ' (you can switch screens)') : null,
      S.status && h('div', { className: 'muted small cx-busy' }, S.status),
      S.lib && h('div', { className: 'cx-libpick' }, h('div', { className: 'row' }, h('b', null, 'Attach a book from your Library'), h('button', { className: 'icon-btn', onClick: () => { S.lib = null; render(); } }, '✕')),
        ...(S.lib.length ? S.lib.map(d => h('button', { className: 'cx-libitem', onClick: () => addLibrary(d) }, d.name, h('span', { className: 'muted small' }, ` · ${d.subject || 'no subject'} · ${d.pageCount || d.pages || ''} pages`))) : [h('div', { className: 'muted small' }, 'Your Library is empty.')])),
      S.mqOpen ? mcqPanel() : null, S.voice === 'on' ? h('div', { className: 'cx-voicehint muted small' }, '🎙 Listening. Say: send message · stop listening · new chat · show questions · open practice · open library · “show questions about <topic>”') : null, composer(root, sendNow, fileIn)),
    S.panel && patternsPanel());
  root.replaceChildren(view);
  const t2 = root.querySelector('textarea'); if (t2) t2.value = draft;
  const ms = root.querySelector('.cx-msgs'); if (ms && atBottom) ms.scrollTop = ms.scrollHeight;
  const mainEl = root.querySelector('.cx-main');
  if (ms && mainEl) { const dn = h('button', { className: 'cx-down', title: 'Scroll to latest', style: 'display:none', onClick: () => { ms.scrollTop = ms.scrollHeight; } }, '↓'); mainEl.append(dn); const chk = () => { dn.style.display = ms.scrollHeight - ms.scrollTop - ms.clientHeight > 120 ? 'block' : 'none'; }; ms.addEventListener('scroll', chk); chk(); }
}

export async function mount(el) {
  S.el = el;
  if(window.__cfChatSeed){S.draft=window.__cfChatSeed;window.__cfChatSeed=null;}
  if (S.cur == null && chats().length) S.cur = chats()[0].id;
  const seedFn=ev=>{const t=ev?.detail?.text;if(t&&S.el){S.draft=String(t).slice(0,20000);render();}};
  window.addEventListener('amc-chat-seed',seedFn);
  render();
  await loadModels(); try { S.docs = await B().ge(); } catch {} render();
  return () => { window.removeEventListener('amc-chat-seed', seedFn); if (S.el === el) S.el = null; };
}


// ---- composer, voice, library search, question tools
export const EFF = [['min', 'Minimum'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['extra', 'Extra'], ['ultra', 'Ultra']];
S.mq = { bank: 'success', q: '', page: 0, items: null, total: 0 }; S.effort = LS.get('amc.chat.effort', 'medium'); S.lang = LS.get('amc.chat.lang', 'en-IN'); S.useLib = LS.get('amc.chat.lib', true);
export const PC = new Map();
export async function pagesOf(id) {
  if (PC.has(id)) return PC.get(id);
  const p = (await B().be(id)).map(x => x.text || ''); PC.set(id, p);
  if (PC.size > 40) PC.delete(PC.keys().next().value);
  return p;
}
export async function libContext(query) {
  const q = [...new Set(tokens(query))]; if (!q.length) return null;
  const need = Math.min(2, q.length), cand = [], src = [];
  for (const d of await B().ge()) {
    let pg; try { pg = await pagesOf(d.id); } catch { continue; }
    pg.forEach((t, i) => { if (!t) return; const lt = t.toLowerCase(); let s = 0; for (const w of q) if (lt.includes(w)) s++; if (s >= need) cand.push({ att: d.name, docId: d.id, page: i + 1, text: t.slice(0, 2400), s }); });
  }
  cand.sort((a, b) => b.s - a.s);
  const picked = []; let used = 0;
  for (const c of rank(cand.slice(0, 40), query)) { if (picked.length >= 8 || used + c.text.length > 12000) continue; picked.push(c); used += c.text.length; }
  let block = picked.length ? 'Library excerpts from the student\'s own books (cite as [book name p.N]):\n' + picked.map(c => `[${c.att} p.${c.page}]\n${c.text}`).join('\n\n') : '';
  picked.forEach(c => src.push({ att: c.att, docId: c.docId, page: c.page }));
  const qs = [], hits = [];
  for (const bank of ['emedici', 'success', 'amc']) {
    let bk; try { bk = await loadBank(bank); } catch { bk = null; } if (!bk) continue;
    for (const x of bk.questions) { const lt = (x.question + ' ' + (x.topic || '') + ' ' + (x.chapter || '') + ' ' + (x.explanation || '')).toLowerCase(); let s = 0; for (const w of q) if (lt.includes(w)) s++; if (s >= need) hits.push({ bank, x, s }); }
  }
  hits.sort((a, b) => b.s - a.s);
  for (const { bank, x } of hits.slice(0, 3)) { qs.push(`[MCQ bank: ${bank}] ${x.question}\nOptions: ${x.options.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join(' | ')}\nAnswer: ${String.fromCharCode(65 + x.answerIndex)}. ${String(x.explanation || '').slice(0, 500)}`); src.push({ att: 'MCQ bank: ' + bank, mcq: String(x.question).slice(0, 70) }); }
  if (qs.length) block += (block ? '\n\n' : '') + 'MCQ bank matches:\n' + qs.join('\n\n');
  if (!block) block = 'Library search: nothing in the student\'s imported books or MCQ banks matched this query. Say so plainly, do not invent book text; anything else must be marked (general knowledge).';
  return { block, src, found: picked.length + qs.length };
}
export function openDoc(docId, page) { window.dispatchEvent(new CustomEvent('amc-open-doc', { detail: { docId, page } })); }
export function citeClick(ev) {
  const sp = ev.target.closest?.('.cx-cite'); if (!sp) return;
  const m = sp.textContent.match(/^(.*?)\s+p\.(\d+)/); if (!m) return;
  const n = m[1].trim().toLowerCase(), d = (S.docs || []).find(x => x.name.toLowerCase() === n) || (S.docs || []).find(x => x.name.toLowerCase().includes(n) || n.includes(x.name.toLowerCase()));
  if (d) openDoc(d.id, +m[2]);
}
export function srcChips(rep) {
  return (rep.sources || []).map(s => s.docId
    ? h('button', { className: 'chip', title: 'Open this page in the reader', onClick: () => openDoc(s.docId, s.page) }, '📖 ' + s.att + ' p.' + s.page)
    : h('span', { className: 'chip', title: s.mcq }, '🧩 ' + s.att));
}
export function toggleMic(root) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { S.err = 'Speech recognition is not available in this window. On Windows you can press Win+H for voice typing.'; render(); return; }
  if (S.rec) { S.rec.stop(); return; }
  const ta = root.querySelector('textarea'), base = ta.value ? ta.value.trimEnd() + ' ' : '';
  const r = new SR(); r.lang = S.lang; r.interimResults = true; r.continuous = true; let fin = '';
  r.onresult = ev => {
    let interim = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) fin += t + ' '; else interim += t; }
    const t2 = root.querySelector('textarea'); if (t2) { t2.value = base + fin + interim; S.draft = t2.value; t2.style.height = 'auto'; t2.style.height = Math.min(t2.scrollHeight, 200) + 'px'; }
  };
  r.onerror = ev => { S.err = (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') ? 'Microphone access was denied. Allow it in Windows Settings > Privacy > Microphone.' : ev.error === 'network' ? 'The speech service could not be reached (it needs internet). On Windows, Win+H voice typing works offline-friendly.' : ev.error === 'no-speech' ? '' : 'Mic error: ' + ev.error; };
  r.onend = () => { S.rec = null; render(); };
  S.rec = r; try { r.start(); } catch (x) { S.rec = null; S.err = 'Could not start the microphone: ' + x.message; } render();
}
export function effortNow() { const hi = ['extra', 'ultra']; return S.think ? (hi.includes(S.effort) ? S.effort : 'high') : (hi.includes(S.effort) || S.effort === 'high' ? 'medium' : S.effort); }
export function composer(root, sendNow, fileIn) {
  const imgIn = h('input', { type: 'file', multiple: true, accept: 'image/*', style: 'display:none', onChange: ev => { addFiles(ev.target.files); ev.target.value = ''; } });
  const sel = (title, opts, val, on) => { const s = h('select', { className: 'cx-sel', title, onChange: ev => on(ev.target.value) }, ...opts.map(([v, l]) => h('option', { value: v }, l))); s.value = val; return s; };
  const m1 = S.models.find(x => x.id === S.sel[0]);
  const ta = h('textarea', { rows: 1, placeholder: 'Ask anything. Your books and MCQ banks are searched first.', onKeydown: ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); if (!S.gen) sendNow(); } }, onInput: ev => { S.draft = ev.target.value; ev.target.style.height = 'auto'; ev.target.style.height = Math.min(ev.target.scrollHeight, 200) + 'px'; slashHint(ev.target); } });
  const item = (label, fn) => h('button', { className: 'cx-popitem', onClick: () => { S.plus = false; fn(); render(); } }, label);
  return h('div', { className: 'cx-compose' },
    S.tray.length ? h('div', { className: 'cx-tray' }, ...S.tray.map(t => attChip(t, true))) : null,
    h('div', { className: 'cx-box' }, ta,
      h('div', { className: 'cx-bar' }, fileIn, imgIn,
        h('div', { className: 'cx-popwrap' },
          h('button', { className: 'cx-round cx-popbtn', title: 'Add to this message', onClick: () => { S.plus = !S.plus; S.mm = false; render(); } }, '+'),
          S.plus ? h('div', { className: 'cx-pop up' },
            item('📎  Attach file (PDF, Word, text)', () => fileIn.click()),
            item('🖼  Attach image (read with OCR)', () => imgIn.click()),
            item('📚  Attach a Library book', async () => { S.lib = await B().ge(); render(); }),
            item('🧩  Read MCQs', () => { S.mqOpen = true; if (!S.mq.items) mcqRun(); })) : null),
        h('button', { className: 'cx-pill' + (S.think ? ' on' : ''), title: S.think ? 'Think is on: the model reasons at High effort or above' : 'Think is off: quick answers at your chosen effort', onClick: () => { S.think = !S.think; LS.set('amc.chat.think', S.think); render(); } }, '💡 Think'),
        h('button', { className: 'cx-pill' + (S.search ? ' on' : ''), title: 'Search the web (Grok subscription only)', onClick: () => { S.search = !S.search; LS.set('amc.chat.search', S.search); render(); } }, '🌐 Search'),
        h('button', { className: 'cx-pill' + (S.useLib ? ' on' : ''), title: 'Search your imported books and MCQ banks before answering', onClick: () => { S.useLib = !S.useLib; LS.set('amc.chat.lib', S.useLib); render(); } }, '📖 Books & MCQs'),
        h('button', { className: 'cx-pill' + (S.mqOpen ? ' on' : ''), title: 'Read the MCQ banks here', onClick: () => { S.mqOpen = !S.mqOpen; if (S.mqOpen && !S.mq.items) mcqRun(); render(); } }, '🧩 MCQs'),
        h('span', { className: 'cx-grow' }),
        h('div', { className: 'cx-popwrap' },
          h('button', { className: 'cx-pill cx-popbtn', title: 'Provider, model and effort', onClick: () => { S.mm = !S.mm; S.plus = false; render(); } }, (m1 ? (m1.model || m1.name) : 'Choose model') + ' · ' + (EFF.find(x => x[0] === effortNow()) || ['', ''])[1] + ' ▾'),
          S.mm ? h('div', { className: 'cx-pop up right' },
            S.models.length ? h('label', { className: 'cx-poprow' }, 'Provider', sel('Provider', S.models.map(x => [x.id, x.name]), S.sel[0] || '', v => { S.sel = [v]; LS.set('amc.chat.sel', S.sel); render(); })) : h('div', { className: 'muted small' }, 'Sign in under Settings first.'),
            m1 ? h('label', { className: 'cx-poprow' }, 'Model', modelSelect(m1)) : null,
            h('label', { className: 'cx-poprow' }, 'Reply voice', sel('Voice used by Read aloud', [['Ravi', 'Ravi (India)'], ['Heera', 'Heera (India)'], ['George', 'George (UK)'], ['Hazel', 'Hazel (UK)'], ['Susan', 'Susan (UK)']], S.tts, v => { S.tts = v; LS.set('amc.chat.tts', v); })),
            h('div', { className: 'cx-modes' }, ...[['Fast', 'low'], ['Auto', 'medium'], ['Expert', 'high'], ['Heavy', 'ultra']].map(([l, v]) => h('button', { className: 'cx-pill' + (S.effort === v ? ' on' : ''), title: 'Sets effort to ' + v, onClick: () => { S.effort = v; LS.set('amc.chat.effort', v); render(); } }, l))),
            h('label', { className: 'cx-poprow' }, 'Effort', sel('Effort: how hard the model thinks', EFF, S.effort, v => { S.effort = v; LS.set('amc.chat.effort', v); render(); })),
            h('div', { className: 'muted small' }, S.think ? 'Think is on, so replies use at least High.' : 'Think is off.')) : null),
        h('button', { className: 'btn small cx-mic' + (S.voice === 'on' || S.rec ? ' on' : ''), title: 'Speak instead of typing. Commands: send message, stop listening, new chat, show questions, open practice, open library', onClick: () => voiceToggle(root) }, S.voice === 'on' || S.rec ? '⏹ Listening… (click to stop)' : S.voice === 'starting' ? 'Starting…' : '🎤 Voice'),
        h('button', { className: 'cx-send' + (S.gen ? ' stop' : ''), title: S.gen ? 'Stop' : 'Send (Enter)', disabled: !S.gen && !!Object.keys(S.busy).length, onClick: () => S.gen ? S.ac && S.ac.abort() : sendNow() }, S.gen ? '■' : '↑'))));
}
export function qBlock(q) { return `${q.question}\n${q.options.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join('\n')}\nKeyed answer: ${String.fromCharCode(65 + q.answerIndex)}. ${q.options[q.answerIndex]}`; }
export async function explainQ(q) {
  const b = B(), lib = await libContext(q.question + ' ' + q.options[q.answerIndex]).catch(() => null);
  const prompt = `${lib ? lib.block + '\n\n---\n' : ''}Explain this MCQ for exam revision.\n${qBlock(q)}\n\nWrite in markdown with exactly these parts:\n**Why ${String.fromCharCode(65 + q.answerIndex)} is correct** (3-5 lines, the mechanism or rule)\n**Why the others are wrong**, one bullet per option, each saying what that option actually is or when it would be right\n**Exam point** (one or two high-yield lines)\nCite [book name p.N] when you use an excerpt; mark anything else (general knowledge). Do not change the keyed answer; if you think the key is wrong, say so in one line at the end.`;
  const out = await b.fd([{ role: 'user', content: prompt }], { effort: effortNow() });
  return { html: md(out), src: lib ? lib.src : [] };
}
export async function askQ(q, text) {
  const b = B(), lib = await libContext(q.question + ' ' + text).catch(() => null);
  const prompt = `${lib ? lib.block + '\n\n---\n' : ''}A student is reviewing this MCQ and asks: "${text}"
${qBlock(q)}

Answer the student's question directly, exam-focused, in markdown. Cite [book name p.N] for facts taken from the excerpts above; mark anything else (general knowledge).`;
  const out = await b.fd([{ role: 'user', content: prompt }], { effort: effortNow() });
  return { html: md(out), src: lib ? lib.src : [] };
}
export async function notesQ(q, { scope = 'topic', depth = 'standard' } = {}) {
  const b = B(), ans = q.options[q.answerIndex], topic = q.topic || q.chapter || q.unit || q.subject || '';
  const lib = await libContext(scope === 'question' ? q.question + ' ' + ans : topic + ' ' + ans).catch(() => null);
  const n = { brief: '1-2 sections, short', standard: '3-5 sections', detailed: 'up to 8 sections, thorough, with a table where it helps' }[depth] || '3-5 sections';
  const prompt = `${lib ? lib.block + '\n\n---\n' : ''}Make revision notes ${scope === 'question' ? 'only for what this question tests' : `on the whole topic "${topic || ans}"`}.\n${qBlock(q)}\n\nRules:\n- Build the notes FIRST from the library excerpts above and put the page numbers of the source in each section's "pages" array and as [book name p.N] in the text.\n- Only the gaps that the excerpts do not cover may come from standard textbooks or guidelines. Put those in a separate last section titled "Not in your books: add from a standard text (unverified)". Never mix them into the book sections. You have no internet here, so do not claim to have looked anything up.\n- If no excerpt matched, say so in the first section and write everything in the last section.\n- Length: ${n}. Be conservative with doses and values; drug names in English.\nReturn ONLY JSON: {"title":string,"sections":[{"heading":string,"pages":number[],"summary":string,"keyPoints":string[],"highYield":string[],"mnemonics":string[],"table":{"headers":string[],"rows":string[][]}|null}]}`;
  const data = b.wd(b.yd(await b.fd([{ role: 'user', content: prompt }], { json: true, effort: effortNow() })));
  await b.saveNote({ id: b.uid(), createdAt: Date.now(), title: data.title || (topic || 'Question') + ' notes', questionIds: [], data });
  const text = data.sections.map(s => `### ${s.heading}\n${s.summary}\n${(s.keyPoints || []).map(k => '- ' + k).join('\n')}${s.highYield?.length ? '\n**High yield**\n' + s.highYield.map(k => '- ' + k).join('\n') : ''}${s.mnemonics?.length ? '\n**Mnemonic:** ' + s.mnemonics.join('; ') : ''}`).join('\n\n');
  return { html: md(text), src: lib ? lib.src : [], msg: 'Saved to Mock review, Make notes.' };
}


// ---- MCQ reader inside chat
export const MQ_BANKS = [['success', 'AMC SUCCESS'], ['emedici', 'eMedici'], ['amc', 'AMC recalls'], ['all', 'All banks']];
export async function mcqRun() {
  const m = S.mq, q = [...new Set(tokens(m.q))], banks = m.bank === 'all' ? ['success', 'emedici', 'amc'] : [m.bank];
  const pool = [];
  for (const bank of banks) { let bk; try { bk = await loadBank(bank); } catch { bk = null; } if (!bk) continue; for (const x of bk.questions) pool.push({ bank, x, t: [x.question, ...(x.options || []), x.explanation, x.topic, x.chapter, x.unit, x.group].join(' ').toLowerCase() }); }
  const sk = s => s.replace(/[aeiouy]/g, '');
  const score = (p, ws, pre) => { let s = 0; if (pre && !p.k) p.k = sk(p.t); for (const w of ws) if (pre ? (w.length >= 5 ? p.k.includes(sk(w)) : p.t.includes(w)) : p.t.includes(w)) s++; return s; };
  const run = (pre) => pool.map(p => ({ bank: p.bank, x: p.x, s: q.length ? score(p, q, pre) : 0 })).filter(h => !q.length || h.s >= Math.max(1, Math.ceil(q.length * 0.7)));
  let hits = run(false); if (q.length && !hits.length) { hits = run(true); m.fuzzy = hits.length > 0; } else m.fuzzy = false;
  hits.sort((a, b) => b.s - a.s); m.total = hits.length; m.items = hits.slice(m.page * 8, m.page * 8 + 8); render();
}
export function mcqPanel() {
  const m = S.mq, ask = (x) => { const t = S.el.querySelector('textarea'); const v = `Explain this MCQ and the topic behind it:\n${qBlock(x)}`; t.value = v; S.draft = v; t.focus(); };
  const inp = h('input', { className: 'cx-mqin', placeholder: 'Search questions, options, explanations, topics…', onKeydown: ev => { if (ev.key === 'Enter') { m.q = ev.target.value; m.page = 0; mcqRun(); } } }); inp.value = m.q;
  const bsel = h('select', { className: 'cx-sel', onChange: ev => { m.bank = ev.target.value; m.page = 0; mcqRun(); } }, ...MQ_BANKS.map(([v, l]) => h('option', { value: v }, l))); bsel.value = m.bank;
  const pages = Math.max(1, Math.ceil(m.total / 8));
  return h('div', { className: 'cx-mq' },
    h('div', { className: 'cx-mqh' }, h('b', null, '🧩 MCQ reader'), bsel, inp, h('button', { className: 'btn small', onClick: () => { m.q = inp.value; m.page = 0; mcqRun(); } }, 'Search'), h('span', { className: 'muted small' }, `${m.total} found${m.fuzzy ? ' (closest spelling)' : ''}`), h('span', { className: 'cx-grow' }), h('button', { className: 'icon-btn', onClick: () => { S.mqOpen = false; render(); } }, '✕')),
    h('div', { className: 'cx-mql' }, ...(m.items || []).map(({ bank, x }) => h('details', { className: 'cx-mqi' },
      h('summary', null, (x.question || '').slice(0, 170) + ((x.question || '').length > 170 ? '…' : ''), h('span', { className: 'muted small' }, ' · ' + bank)),
      x.image ? h('img', { className: 'clinical-image', src: x.image }) : null,
      h('div', { className: 'selectable' }, h('p', null, x.question), h('ol', { type: 'A' }, ...x.options.map((o, i) => h('li', { className: i === x.answerIndex ? 'an-correct' : '' }, o + (i === x.answerIndex ? ' ✓' : '')))), h('p', null, h('b', null, 'Answer: '), String.fromCharCode(65 + x.answerIndex) + '. ' + x.options[x.answerIndex]), h('p', null, x.explanation || 'No explanation in the bank.'), h('p', { className: 'muted small' }, [x.group, x.unit, x.chapter || x.topic].filter(Boolean).join(' › '))),
      h('button', { className: 'btn small', onClick: () => ask(x) }, '💬 Ask about this')))),
    m.items && !m.items.length ? h('div', { className: 'muted small' }, 'Nothing matched. Try fewer words or “All banks”.') : null,
    h('div', { className: 'cx-mqp' }, h('button', { className: 'btn small', disabled: m.page <= 0, onClick: () => { m.page--; mcqRun(); } }, '‹ Prev'), h('span', { className: 'muted small' }, ` Page ${m.page + 1} / ${pages} `), h('button', { className: 'btn small', disabled: m.page + 1 >= pages, onClick: () => { m.page++; mcqRun(); } }, 'Next ›')));
}

// ---- voice: Windows speech engine (desktop) with commands; falls back to the browser engine
export function setTa(v) { const t = S.el && S.el.querySelector('textarea'); S.draft = v; if (t) { t.value = v; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 200) + 'px'; } }
export function sendDraft() { const t = S.el && S.el.querySelector('textarea'); if (!t || S.gen) return; const v = t.value; t.value = ''; S.draft = ''; S.vbase = ''; S.vfin = ''; send(v); }
export function goNav(name) { [...document.querySelectorAll('.nav-item')].find(b => b.innerText.includes(name))?.click(); }
export function voiceCmd(c) {
  c = c.toLowerCase();
  if (c === 'send message') sendDraft();
  else if (c === 'stop listening') { if (S.vstop) S.vstop(); else window.native.speech.stop(); }
  else if (c === 'new chat') { newChat(); S.tray = []; S.vbase = ''; S.vfin = ''; render(); }
  else if (c === 'clear text') { S.vbase = ''; S.vfin = ''; setTa(''); }
  else if (c === 'show questions') { S.mqOpen = true; if (!S.mq.items) mcqRun(); render(); }
  else if (c.startsWith('open ')) goNav({ practice: 'Practice', library: 'Library', chat: 'Chat', progress: 'Progress' }[c.slice(5)] || '#');
}
export function voiceLine(line) {
  const [k, ...r] = line.split('\t'), t = r.join('\t');
  if (k === 'READY') { S.voice = 'on'; const ta = S.el && S.el.querySelector('textarea'); S.vbase = ta && ta.value ? ta.value.trimEnd() + ' ' : ''; S.vfin = ''; S.err = ''; render(); }
  else if (k === 'HYP') setTa((S.vbase || '') + (S.vfin || '') + t);
  else if (k === 'CMD') voiceCmd(t);
  else if (k === 'RESULT') {
    const m = t.match(/^(?:show|read|open)\s+(?:me\s+)?(?:the\s+)?(?:questions?|mcqs?)\s+(?:about|on)\s+(.+)$/i);
    if (m) { S.mq.q = m[1].replace(/[.?!,]+$/,''); S.mq.page = 0; S.mqOpen = true; mcqRun(); return; }
    S.vfin = (S.vfin || '') + t + ' '; setTa((S.vbase || '') + S.vfin);
  }
  else if (k === 'ERROR') { S.voice = null; S.err = t; render(); }
  else if (k === 'END') { S.voice = null; render(); }
}

// ---- voice via whisper.cpp: listen, cut at pauses, transcribe each phrase offline
export const VCMD = { 'send message': 'send message', 'send it': 'send message', 'stop listening': 'stop listening', 'new chat': 'new chat', 'clear text': 'clear text', 'show questions': 'show questions', 'open practice': 'open practice', 'open library': 'open library', 'open chat': 'open chat', 'open progress': 'open progress' };
export function wavOf(f32, rate) {
  const n = Math.floor(f32.length * 16000 / rate), out = new Int16Array(n), r = rate / 16000;
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[Math.floor(i * r)] || 0)); out[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  const buf = new ArrayBuffer(44 + out.length * 2), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + out.length * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, out.length * 2, true);
  new Int16Array(buf, 44).set(out); return buf;
}
export async function sendSeg(chunks, rate) {
  const len = chunks.reduce((a, c) => a + c.length, 0); if (len < rate * 0.45) return;
  const all = new Float32Array(len); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  S.vbusy = (S.vbusy || 0) + 1; setTa((S.vbase || '') + (S.vfin || '') + '…');
  let r; try { r = await window.native.speech.transcribe(wavOf(all, rate)); } catch (x) { r = { error: x.message }; }
  S.vbusy--;
  if (r.error) { S.err = r.error; render(); return; }
  let t = (r.text || '').trim();
  if (!t || /^[\[(].*[\])]$/.test(t) || /^(you|thank you\.?|thanks for watching\.?)$/i.test(t)) { setTa((S.vbase || '') + (S.vfin || '')); return; }
  const norm = t.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  if (VCMD[norm]) { setTa((S.vbase || '') + (S.vfin || '')); voiceLine('CMD\t' + VCMD[norm]); return; }
  voiceLine('RESULT\t' + t);
}
export async function whisperStart() {
  S.voice = 'starting'; S.err = ''; render();
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch (x) { S.voice = null; S.err = 'Microphone not available: ' + x.message + '. Check Windows Settings > Privacy > Microphone.'; render(); return; }
  const ctx = new AudioContext(), src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), rate = ctx.sampleRate;
  let seg = [], pre = [], speaking = false, last = 0, floor = 0.004;
  proc.onaudioprocess = ev => {
    const d = new Float32Array(ev.inputBuffer.getChannelData(0)); let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    const rms = Math.sqrt(s / d.length), now = performance.now(), thr = Math.max(0.012, floor * 3.5);
    if (rms > thr) { if (!speaking) { speaking = true; seg = pre.slice(); } last = now; }
    else if (!speaking) floor = floor * 0.95 + rms * 0.05;
    if (speaking) { seg.push(d); if (now - last > 900 || seg.length * 4096 > rate * 25) { const g = seg; seg = []; speaking = false; sendSeg(g, rate); } }
    else { pre.push(d); if (pre.length > 3) pre.shift(); }
  };
  src.connect(proc); proc.connect(ctx.destination);
  S.vstop = () => { try { proc.disconnect(); src.disconnect(); } catch {} stream.getTracks().forEach(t => t.stop()); ctx.close(); if (speaking && seg.length) sendSeg(seg, rate); S.vstop = null; S.voice = null; render(); };
  const ta = S.el && S.el.querySelector('textarea'); S.vbase = ta && ta.value ? ta.value.trimEnd() + ' ' : ''; S.vfin = ''; S.voice = 'on'; render();
}
export async function voiceToggle(root) {
  const N = window.native && window.native.speech;
  if (N && N.transcribe) { if (S.voice === 'on') { S.vstop && S.vstop(); return; } if (S.voice === 'starting') return; return whisperStart(); }
  if (!N) return toggleMic(root);
  if (S.voice === 'on') { N.stop(); return; }
  if (S.voice === 'starting') return;
  S.voice = 'starting'; S.err = ''; render();
  let r; try { r = await N.start('en'); } catch (x) { r = { error: x.message }; }
  if (r && r.error) { S.voice = null; S.err = r.error; render(); }
}
window.__amcVoiceLine = voiceLine;
if (window.native && window.native.speech && !window.__amcVoiceSub) window.__amcVoiceSub = window.native.speech.onLine(voiceLine);


// ---- Grok-style chat features: message actions, follow-ups, read aloud, chat list
S.think = LS.get('amc.chat.think', true); S.search = LS.get('amc.chat.search', false);
export function resendFrom(chat, mi, text) { if (S.gen) return; chat.msgs.splice(mi); S.edit = null; saveChats(); send(text); }
export function plainText(t) { return String(t).replace(/<<RULE[\s\S]*?<<\/RULE>>/g, '').replace(/[*_`#>|]/g, ' ').replace(/\s+/g, ' ').trim(); }
S.tts = LS.get('amc.chat.tts', 'Ravi');
export function stopSpeech() { S.speakGen = (S.speakGen || 0) + 1; if (S.audio) { try { S.audio.pause(); } catch {} S.audio = null; } try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {} }
export function speechChunks(t) { const out = []; let cur = ''; for (const s of plainText(t).split(/(?<=[.!?])\s+/)) { if ((cur + ' ' + s).length > 380 && cur) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s; } if (cur) out.push(cur); return out; }
export async function readAloud(mi, text) {
  const N = window.native && window.native.speech;
  if (S.speaking === mi) { stopSpeech(); S.speaking = null; render(); return; }
  stopSpeech(); const gen = S.speakGen; S.speaking = mi; render();
  if (!N || !N.say) { S.err = 'Read aloud needs the desktop app.'; S.speaking = null; render(); return; }
  const chunks = speechChunks(text); if (!chunks.length) { S.speaking = null; render(); return; }
  const fetchWav = c => N.say(c, S.tts).then(r => { if (r.error) throw Error(r.error); return URL.createObjectURL(new Blob([r.wav], { type: 'audio/wav' })); });
  let next = fetchWav(chunks[0]);
  try {
    for (let i = 0; i < chunks.length; i++) {
      const url = await next; if (gen !== S.speakGen) { URL.revokeObjectURL(url); return; }
      if (i + 1 < chunks.length) next = fetchWav(chunks[i + 1]);
      await new Promise((res, rej) => { const au = new Audio(url); S.audio = au; au.onended = res; au.onerror = () => rej(Error('Could not play the audio.')); au.play().catch(rej); });
      URL.revokeObjectURL(url); if (gen !== S.speakGen) return;
    }
  } catch (x) { if (gen === S.speakGen) S.err = 'Read aloud failed: ' + x.message; }
  if (gen === S.speakGen) { S.speaking = null; S.audio = null; render(); }
}
export function actBtn(label, title, fn, on) { return h('button', { className: 'cx-act' + (on ? ' on' : ''), title, onClick: fn }, label); }
export const FOLLOW = ['Explain this more simply', 'Make 5 MCQs on this', 'Summarise as a table', 'What are the high-yield points?'];
export function msgView(chat, m, mi) {
  const last = mi === chat.msgs.length - 1;
  if (m.role === 'user') {
    if (S.edit === mi) {
      const ta = h('textarea', { className: 'cx-editta', rows: 3 }); ta.value = m.content;
      return h('div', { className: 'cx-user' }, h('div', { className: 'cx-edit' }, ta, h('div', { className: 'row' }, h('button', { className: 'btn primary small', onClick: () => { const v = ta.value.trim(); if (v) resendFrom(chat, mi, v); } }, 'Save & resend'), h('button', { className: 'btn small', onClick: () => { S.edit = null; render(); } }, 'Cancel'))));
    }
    return h('div', { className: 'cx-user' }, h('div', { className: 'cx-bubble selectable' }, m.content),
      m.atts?.length ? h('div', { className: 'cx-uatts' }, ...m.atts.map(n => chat.atts.find(a => a.name === n)).filter(Boolean).map(a => attChip(a, false))) : null,
      h('div', { className: 'cx-acts' }, actBtn('Copy', 'Copy your message', () => navigator.clipboard.writeText(m.content)), S.gen ? null : actBtn('✎ Edit', 'Edit this message and resend', () => { S.edit = mi; render(); })));
  }
  const busy = m.replies.some(r => r.busy), txt = m.replies.map(r => r.text).filter(Boolean).join('\n\n'), ok = txt && !busy;
  let prev = ''; for (let i = mi - 1; i >= 0; i--) if (chat.msgs[i].role === 'user') { prev = chat.msgs[i].content; break; }
  const pi = (() => { for (let i = mi - 1; i >= 0; i--) if (chat.msgs[i].role === 'user') return i; return -1; })();
  return h('div', { className: 'cx-turnwrap' },
    h('div', { className: 'cx-turn' + (m.replies.length > 1 ? ' grid' : '') }, ...m.replies.map(r => replyView(r, m.replies.length > 1))),
    ok ? h('div', { className: 'cx-acts' },
      actBtn('Copy', 'Copy the reply', () => navigator.clipboard.writeText(txt)),
      actBtn(S.speaking === mi ? '⏹ Stop' : '🔊 Read aloud', 'Read the reply aloud with the Windows voice', () => readAloud(mi, txt)),
      actBtn('👍', 'Helpful (saved on this PC only)', () => { m.fb = m.fb === 'up' ? null : 'up'; saveChats(); render(); }, m.fb === 'up'),
      actBtn('👎', 'Not helpful (saved on this PC only)', () => { m.fb = m.fb === 'down' ? null : 'down'; saveChats(); render(); }, m.fb === 'down'),
      last && pi >= 0 && !S.gen ? actBtn('↻ Regenerate', 'Ask again', () => resendFrom(chat, pi, prev)) : null) : null,
    last && ok && !S.gen && !m.replies.some(r => r.error) && m.kind !== 'profile' ? h('div', { className: 'cx-follow' }, ...FOLLOW.map(t => h('button', { className: 'chip', onClick: () => { if (!S.gen) send(t); } }, t))) : null);
}
export function chatList() {
  const wrap = h('div', { className: 'cx-listwrap' });
  const list = h('div', { className: 'cx-list' });
  const fill = () => {
    const q = (S.cq || '').toLowerCase();
    list.replaceChildren(...chats().filter(c => !q || c.title.toLowerCase().includes(q) || c.msgs.some(m => (m.role === 'user' ? String(m.content) : (m.replies || []).map(r => r.text || '').join(' ')).toLowerCase().includes(q))).map(c => {
      if (S.renaming === c.id) {
        const inp = h('input', { className: 'cx-rename', onKeydown: ev => { if (ev.key === 'Enter') { c.title = inp.value.trim() || c.title; S.renaming = null; saveChats(); render(); } else if (ev.key === 'Escape') { S.renaming = null; render(); } } }); inp.value = c.title; setTimeout(() => inp.focus(), 0);
        return h('div', { className: 'cx-ci on' }, inp);
      }
      return h('div', { className: 'cx-ci' + (c.id === S.cur ? ' on' : ''), onClick: () => { stopSpeech(); S.speaking = null; S.cur = c.id; render(); }, onDblclick: () => { S.renaming = c.id; render(); } },
        h('span', null, c.title),
        h('button', { className: 'icon-btn', title: 'Rename', onClick: ev => { ev.stopPropagation(); S.renaming = c.id; render(); } }, '✎'),
        h('button', { className: 'icon-btn', title: 'Delete chat', onClick: ev => { ev.stopPropagation(); if (confirm('Delete this chat?')) { S.chats = chats().filter(x => x !== c); if (S.cur === c.id) S.cur = null; saveChats(); render(); } } }, '✕'));
    }));
  };
  const search = h('input', { className: 'cx-search', placeholder: 'Search chats…', onInput: ev => { S.cq = ev.target.value; fill(); } }); search.value = S.cq || '';
  fill(); wrap.append(search, list); return wrap;
}
document.addEventListener('click', ev => {
  const cb = ev.target.closest && ev.target.closest('.cx-copycode');
  if (cb) { navigator.clipboard.writeText(cb.parentElement.querySelector('code').innerText); cb.textContent = 'Copied'; setTimeout(() => { cb.textContent = 'Copy'; }, 1200); return; }
  if ((S.mm || S.plus) && !(ev.target.closest && ev.target.closest('.cx-pop,.cx-popbtn'))) { S.mm = false; S.plus = false; render(); }
});


// ---- web search, image generation, slash commands (Grok subscription)
export const isXai = m => { try { return !!m && B().X(m.id).sub === 'xai'; } catch { return false; } };
export const SLASH = [['/imagine', 'Generate an image (Grok subscription)'], ['/search', 'Answer using a web search (Grok subscription)'], ['/mcq', 'Open the MCQ reader on a topic'], ['/notes', 'Write notes on a topic from your books'], ['/practice', 'Open Practice'], ['/library', 'Open Library']];
export function slashHint(ta) {
  const box = ta.closest('.cx-box'); if (!box) return;
  box.querySelector('.cx-slash')?.remove();
  const v = ta.value; if (!/^\/\w*$/.test(v)) return;
  const list = SLASH.filter(([c]) => c.startsWith(v.toLowerCase()));
  if (!list.length) return;
  box.append(h('div', { className: 'cx-slash' }, ...list.map(([c, d]) => h('button', { className: 'cx-popitem', onClick: () => { ta.value = c + ' '; S.draft = ta.value; box.querySelector('.cx-slash')?.remove(); ta.focus(); } }, h('b', null, c), '  ', h('span', { className: 'muted small' }, d)))));
}
export async function slash(text) {
  const m = text.trim().match(/^(\/\w+)\s*([\s\S]*)$/); if (!m) return false;
  const cmd = m[1].toLowerCase(), arg = m[2].trim();
  const bad = msg => { S.err = msg; setTa(text); render(); return true; };
  if (!SLASH.some(([c]) => c === cmd)) return bad(`Unknown command ${cmd}. Type / to see the list.`);
  if (cmd === '/practice') goNav('Practice');
  else if (cmd === '/library') goNav('Library');
  else if (cmd === '/mcq') { S.mq.q = arg; S.mq.page = 0; S.mqOpen = true; mcqRun(); }
  else if (cmd === '/imagine') { if (!arg) return bad('Describe the image: /imagine a diagram of the cardiac cycle'); imagine(arg); }
  else if (cmd === '/search') { if (!arg) return bad('Add a question: /search latest NEET PG exam date'); S.forceSearch = true; try { await send(arg); } finally { S.forceSearch = false; } }
  else if (cmd === '/notes') { if (!arg) return bad('Add a topic: /notes heart failure'); await send('Make revision notes on: ' + arg + '. Use my books first and cite the pages.'); }
  return true;
}
export async function imagine(prompt) {
  const chat = curChat() || newChat();
  chat.msgs.push({ role: 'user', content: '/imagine ' + prompt, ts: Date.now() });
  const rep = { model: S.sel[0] || 'xai-sub', text: '', busy: true }; chat.msgs.push({ role: 'assistant', ts: Date.now(), replies: [rep] });
  if (chat.title === 'New chat') chat.title = prompt.slice(0, 48);
  S.gen = true; saveChats(); render();
  try {
    const r = await fetch('/api/oauth/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(j.error || 'Image generation failed. It needs the Grok subscription sign-in in Settings.');
    const id = 'img' + Date.now(); await putAtt({ id, name: 'image', data: j.url, pages: [], chars: 0 }); rep.imgId = id; rep.text = 'Image for: ' + prompt;
  } catch (x) { rep.error = x.message; }
  rep.busy = false; S.gen = false; saveChats(); render();
}
export function imgView(id) { const im = h('img', { className: 'cx-genimg', alt: 'Generated image' }); getAtt(id).then(a => { if (a && a.data) im.src = a.data; }); return im; }

// floating chat over the reader (the sidebar is hidden in full-screen reading)
(function () {
  const fab = h('button', { id: 'amc-fab', title: 'Chat with your books' }, '✨ Chat'), slot = h('div', { className: 'amc-ov-slot' });
  let un = null, open = false;
  const ov = h('div', { id: 'amc-chat-ov' }, h('div', { className: 'amc-ov-h' }, h('b', null, 'Chat'), h('button', { className: 'icon-btn', onClick: () => close() }, '✕')), slot);
  const close = () => { open = false; ov.style.display = 'none'; if (un) { un(); un = null; } };
  fab.onclick = async () => { if (open) return close(); open = true; ov.style.display = 'flex'; un = await mount(slot); };
  const boot = () => document.body.append(fab, ov);
  document.body ? boot() : document.addEventListener('DOMContentLoaded', boot);
  setInterval(() => { const on = !!document.querySelector('.page.reader'); fab.style.display = on ? 'block' : 'none'; if (!on && open) close(); }, 500);
})();

