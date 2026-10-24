// Pattern rules and learned profiles: parsing, storage shape and the prompt text added to AI calls.
export const RULE_RE = /<<RULE\s+scope="(neet|ini|amc|all)"\s+target="(mcq|notes|all)">([\s\S]*?)<<\/RULE>>/gi;
export function extractRules(reply) {
  const rules = [];
  const text = String(reply).replace(RULE_RE, (_, scope, target, body) => { const t = body.trim(); if (t) rules.push({ scope: scope.toLowerCase(), target: target.toLowerCase(), text: t }); return ''; }).trim();
  return { text, rules };
}
export const EXAM = { neet: 'NEET PG', ini: 'INI-CET', amc: 'AMC', all: 'all exams' };
export function detectTarget(messages, json) {
  const last = [...(messages || [])].reverse().find(m => m.role === 'user');
  const t = String(last?.content || '');
  if (/\bMCQs?\b|multiple[- ]choice|questions?\b.*options|"mcqs"/i.test(t)) return 'mcq';
  if (/notes|revision|summar/i.test(t)) return 'notes';
  return json ? 'mcq' : 'other';
}
export function detectExam(messages, amcMode) {
  const t = (messages || []).map(m => m.content).join(' ');
  if (/INI-?CET|AIIMS/i.test(t)) return 'ini';
  if (/\bAMC\b|Australian/i.test(t)) return 'amc';
  if (/NEET/i.test(t)) return 'neet';
  return amcMode ? 'amc' : 'neet';
}
export const BOOST = [
  '',
  'Make these questions harder than the real exam: each needs at least two linked reasoning steps and every distractor must be plausible.',
  'Make these questions well beyond exam level: three linked reasoning steps (for example diagnosis, then the complication, then its management), distractors that are each wrong for one specific reason, and integration of two subjects. Stay inside the exam syllabus.',
  'Make these questions at the hardest level a top scorer could still answer: multi-step reasoning, closely matched distractors, two- or three-subject integration and examinable but less common facts. Stay inside the syllabus and keep every fact verifiable.'
];
export function rulesPrompt({ rules = [], profiles = [], boost = 0 }, { target, exam }) {
  if (target === 'other') return '';
  const fits = r => r.on !== false && (r.scope === 'all' || r.scope === exam) && (r.target === 'all' || r.target === target);
  const lines = rules.filter(fits).map(r => '- ' + r.text);
  const profs = target === 'mcq' ? profiles.filter(p => p.on !== false && (p.exam === 'all' || p.exam === exam)) : [];
  let out = '';
  if (lines.length) out += `\n\nThe student has set these rules for ${EXAM[exam]} ${target === 'mcq' ? 'questions' : 'notes'}. Follow them unless they conflict with medical accuracy:\n` + lines.join('\n');
  for (const p of profs) out += `\n\nMatch this learned question pattern ("${p.name}", from ${p.count} sample questions):\n` + profileText(p);
  if (target === 'mcq' && boost > 0) out += '\n\n' + BOOST[Math.min(3, boost)] + ' Label each such question\'s tag as "Beyond exam level".';
  return out;
}
export function profileText(p) {
  const f = p.format || {}, d = p.difficulty || {};
  const parts = [];
  if (f.options) parts.push(`${f.options} options per question`);
  if (f.stem) parts.push(`stems: ${f.stem}`);
  if (f.lead_ins?.length) parts.push(`typical lead-ins: ${f.lead_ins.slice(0, 6).join('; ')}`);
  if (p.mix) parts.push('question-type mix: ' + Object.entries(p.mix).map(([k, v]) => `${k} ${v}%`).join(', '));
  if (d.easy != null) parts.push(`difficulty: easy ${d.easy}%, medium ${d.medium}%, hard ${d.hard}%`);
  if (p.distractors) parts.push('distractors: ' + p.distractors);
  return parts.map(x => '- ' + x).concat((p.style_rules || []).map(x => '- ' + x)).join('\n');
}
export function normProfile(j, name, exam) {
  const n = x => Math.max(0, Math.min(100, Math.round(+x || 0)));
  const mix = {}; Object.entries(j.mix || {}).forEach(([k, v]) => { if (+v > 0) mix[k] = n(v); });
  const d = j.difficulty || {};
  return {
    id: Date.now(), on: true, name: j.name || name, exam: ['neet', 'ini', 'amc', 'all'].includes(j.exam) ? j.exam : exam,
    count: Math.max(0, Math.round(+j.count || 0)),
    format: { options: Math.round(+j.format?.options || 0) || undefined, stem: String(j.format?.stem || ''), lead_ins: (j.format?.lead_ins || []).map(String).slice(0, 8) },
    mix, difficulty: { easy: n(d.easy), medium: n(d.medium), hard: n(d.hard), notes: String(d.notes || '') },
    distractors: String(j.distractors || ''), style_rules: (j.style_rules || []).map(String).slice(0, 10), ts: Date.now()
  };
}

