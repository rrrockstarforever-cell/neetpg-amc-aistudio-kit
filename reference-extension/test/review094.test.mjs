import test from 'node:test';
import assert from 'node:assert/strict';
import * as review from '../src/analytics.js';

const rows = [
 {id:'a',exam:'amc',question:'Renal trap',subject:'Medicine',choice:0,correct:false,ts:1},
 {id:'a',exam:'amc',question:'Renal trap',subject:'Medicine',choice:0,correct:false,ts:3},
 {id:'b',exam:'amc',question:'Heart',subject:'Medicine',choice:1,correct:true,ts:5},
 {id:'a',exam:'neet',question:'Renal trap',subject:'Medicine',choice:0,correct:false,ts:8}
];
test('review composes scoped query, subject, user-only trap and flag filters without changing evidence',()=>{
 const before=JSON.stringify(rows);
 const meta={[JSON.stringify(['amc','a'])]:{trap:'Conceptual Gap',flagged:true}};
 assert.equal(typeof review.cfReviewFilter,'function');
 const result=review.cfReviewFilter(rows,{exam:'amc',query:' RENAL ',subject:'Medicine',trap:'Conceptual Gap',flagged:true},meta);
 assert.equal(result.length,1); assert.equal(result[0].errors,2); assert.equal(result[0].ts,3);
 assert.equal(review.cfReviewFilter(rows,{exam:'amc',trap:'Renal trap'},meta).length,0);
 assert.deepEqual(review.cfReviewFilter(rows,{exam:'amc',sort:'newest'},meta).map(r=>r.id),['b','a']);
 assert.deepEqual(review.cfReviewFilter(rows,{exam:'amc',sort:'errors'},meta).map(r=>r.id),['a','b']);
 assert.equal(JSON.stringify(rows),before);
});

test('metadata is isolated by exam and exports actual filtered content',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(typeof review.cfReviewSaveMeta,'function');
 review.cfReviewSaveMeta(rows[0],{notes:'private <note>',trap:'Conceptual Gap',flagged:true,mastered:true},storage);
 const meta=review.cfReviewReadMeta(storage);
 assert.equal(meta[review.cfReviewKey(rows[3])],undefined);
 const list=review.cfReviewFilter(rows,{exam:'amc',query:'renal'},meta);
 assert.match(review.cfReviewTsv(list),/Renal trap/);assert.doesNotMatch(review.cfReviewTsv(list),/private|Heart/);
 assert.equal(JSON.parse(review.cfReviewJson(list,'amc')).questions[0].reviewMeta.notes,'private <note>');
});
test('SRS, remediation and PDF call real integration contracts',async()=>{
 const events=[],env={CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail;}},dispatchEvent:e=>events.push(e),__amcBridge:{addMcqCard:async(q,m)=>{assert.equal(q.id,'a');assert.equal(m.exam,'amc');}},native:{savePdf:async(html,name)=>{assert.match(html,/Accuracy/);assert.match(html,/AMC/);assert.match(name,/pdf$/);return true;}}};
 assert.equal(typeof review.cfReviewAddSrs,'function');
 await review.cfReviewAddSrs(rows[0],env);assert.deepEqual(events[0].detail,{view:'srs'});
 assert.equal(review.cfReviewDrill(rows,'amc','Medicine',5,env).length,1);assert.equal(events[1].type,'amc-drill');
 assert.equal(await review.cfReviewPdf(rows,'amc',env),true);
 await assert.rejects(review.cfReviewAddSrs(rows[0],{}),/unavailable/);
});

test('review screen preserves hierarchy and AI while adding actual notebook controls',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../src/analytics.js',import.meta.url),'utf8');
 for(const marker of ['data-review-query','data-review-subject','data-review-trap','data-review-flagged','data-review-sort','data-review-tsv','data-review-json','data-review-notes','data-review-mastered','data-review-srs','data-progress-pdf','data-remediate'])assert.ok(source.includes(marker),marker);
 assert.ok(source.includes('X.explainQ(r)'));assert.ok(source.includes('data-back'));assert.ok(source.includes('tabsHtml()'));
});
