import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContext, rank, chunk } from '../src/retrieval.js';
import { extractRules, rulesPrompt, detectTarget, detectExam, normProfile, profileText } from '../src/rules.js';

test('small attachments go in whole, with page labels', () => {
  const c = buildContext([{ name: 'Obs', pages: ['Abortion types', 'PPH management'] }], 'abortion');
  assert.equal(c.chunks, c.of);
  assert.match(c.text, /\[Obs p\.1\]/); assert.match(c.text, /\[Obs p\.2\]/);
});
test('large attachments are trimmed to the most relevant passages', () => {
  const pages = Array.from({ length: 60 }, (_, i) => (i === 37 ? 'Missed abortion is managed with misoprostol or suction evacuation. ' : 'Unrelated cardiology text about the heart. ').repeat(40));
  const c = buildContext([{ name: 'Book', pages }], 'missed abortion management', 4000);
  assert.ok(c.chunks < c.of);
  assert.match(c.text, /Book p\.38/);
});
test('rank puts matching chunk first', () => {
  const r = rank(chunk({ name: 'x', pages: ['thyroid storm treatment', 'gout colchicine'] }), 'gout');
  assert.equal(r[0].page, 2);
});
test('rule tags are pulled out of replies', () => {
  const { text, rules } = extractRules('Sure, noted.\n<<RULE scope="ini" target="mcq">Include two multiple-statement questions<</RULE>>');
  assert.equal(text, 'Sure, noted.');
  assert.deepEqual(rules, [{ scope: 'ini', target: 'mcq', text: 'Include two multiple-statement questions' }]);
});
test('rules apply only to matching exam and target', () => {
  const p = { rules: [{ scope: 'ini', target: 'mcq', text: 'R-ini' }, { scope: 'all', target: 'notes', text: 'R-notes' }, { scope: 'all', target: 'mcq', text: 'R-off', on: false }], profiles: [], boost: 0 };
  const a = rulesPrompt(p, { target: 'mcq', exam: 'ini' });
  assert.match(a, /R-ini/); assert.doesNotMatch(a, /R-notes|R-off/);
  assert.equal(rulesPrompt(p, { target: 'mcq', exam: 'neet' }), '');
  assert.match(rulesPrompt(p, { target: 'notes', exam: 'amc' }), /R-notes/);
  assert.equal(rulesPrompt(p, { target: 'other', exam: 'amc' }), '');
});
test('difficulty boost only affects questions', () => {
  const p = { rules: [], profiles: [], boost: 2 };
  assert.match(rulesPrompt(p, { target: 'mcq', exam: 'neet' }), /Beyond exam level/);
  assert.equal(rulesPrompt(p, { target: 'notes', exam: 'neet' }), '');
});
test('target and exam detection', () => {
  assert.equal(detectTarget([{ role: 'user', content: 'Write 10 NEW, exam-standard MCQs for INI-CET' }], true), 'mcq');
  assert.equal(detectTarget([{ role: 'user', content: 'Make revision notes for these mistakes' }], true), 'notes');
  assert.equal(detectTarget([{ role: 'user', content: 'Reply with exactly: OK' }], false), 'other');
  assert.equal(detectExam([{ content: 'AMC CAT MCQ pattern' }], false), 'amc');
  assert.equal(detectExam([{ content: 'anything' }], true), 'amc');
});
test('profiles are normalised and rendered', () => {
  const p = normProfile({ count: 42, exam: 'neet', format: { options: 4, lead_ins: ['Most likely diagnosis?'] }, mix: { 'clinical vignette': 70, 'image based': 30, other: 0 }, difficulty: { easy: 20, medium: 50, hard: 30 }, style_rules: ['No all-of-the-above'] }, 'Sample', 'neet');
  assert.equal(p.count, 42); assert.equal(p.mix.other, undefined);
  const t = profileText(p);
  assert.match(t, /4 options/); assert.match(t, /clinical vignette 70%/); assert.match(t, /No all-of-the-above/);
  assert.match(rulesPrompt({ rules: [], profiles: [p], boost: 0 }, { target: 'mcq', exam: 'neet' }), /learned question pattern/);
});
