import test from 'node:test';import assert from 'node:assert/strict';import * as bank from '../src/bank.js';
test('remaining unseen questions are returned before any repeat; reset only when none left',()=>{
 assert.equal(typeof bank.selectBankQuestions,'function');
 const qs=Array.from({length:5},(_,i)=>({id:'q'+i,group:'Child Health',tier:'hard'}));
 const a=bank.selectBankQuestions(qs,['q0','q1','q2'],{n:4});assert.equal(a.qs.length,2);assert.equal(a.reset,false);assert.ok(a.qs.every(q=>['q3','q4'].includes(q.id)));
 const b=bank.selectBankQuestions(qs,a.seen,{n:4});assert.equal(b.reset,true);assert.equal(new Set(b.qs.map(q=>q.id)).size,4);
});

test('eMedici has independent storage from recalls and unsafe bank ids rejected',()=>{
 assert.equal(typeof bank.bankStorageKey,'function');assert.equal(bank.bankStorageKey('emedici'),'bank:emedici');assert.equal(bank.bankStorageKey(),'bank:amc');assert.throws(()=>bank.bankStorageKey('unknown'));
});

test('selector returns only questions inside the chosen paths and mixes image and text questions',()=>{
 const qs=[{id:'a',group:'Child Health',unit:'Neurology',chapter:'Epilepsy',image:'x.png'},{id:'b',group:'Child Health',unit:'Neurology',chapter:'Epilepsy'},{id:'c',group:'Child Health',unit:'Respiratory',chapter:'Asthma'},{id:'d',group:'Adult Health - Medicine',unit:'Neurology',chapter:'Epilepsy',needsReview:true}];
 const r=bank.selectBankQuestions(qs,[],{paths:['Child Health|Neurology'],n:10});assert.deepEqual(r.qs.map(q=>q.id).sort(),['a','b']);
 assert.throws(()=>bank.selectBankQuestions(qs,[],{paths:['Child Health|Cardiovascular'],n:5}),/No bank questions match/);
 assert.equal(bank.selectBankQuestions(qs,[],{n:10}).total,3);
});

test('success bank id is accepted and amc default unchanged',async()=>{const m=await import('../src/bank.js');assert.equal(m.bankStorageKey(),'bank:amc');assert.equal(m.bankStorageKey('success'),'bank:success');assert.throws(()=>m.bankStorageKey('nope'));});
