import test from 'node:test';import assert from 'node:assert/strict';
test('module summary counts skipped separately and keeps very-hard separate',async()=>{
 const m=await import('../src/analytics.js');const mod={id:1,qs:[{question:'A',options:['a','b'],answerIndex:0,subject:'Medicine',topic:'Cardiology',difficulty:'very_hard'},{question:'B',options:['a','b'],answerIndex:0,subject:'Medicine',topic:'Cardiology',difficulty:'hard'},{question:'C',options:['a','b'],answerIndex:0,subject:'Paediatrics',topic:'Neonatal',difficulty:'medium'}],answers:{0:0,1:1}};
 const a=m.summarizeRows(m.moduleRows(mod));assert.equal(a.total,3);assert.equal(a.correct,1);assert.equal(a.wrong,1);assert.equal(a.skipped,1);assert.equal(a.accuracy,50);assert.equal(a.byDifficulty.find(r=>r.name==='Very hard').correct,1);assert.equal(a.byTopic.find(r=>r.name==='Neonatal').skipped,1);
});
