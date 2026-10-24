import test from 'node:test';import assert from 'node:assert/strict';
test('classifies paediatric seizures by patient and condition, not just age',async()=>{
 const m=await import('../src/taxonomy.js');const q=m.tagQuestion({question:'A 16-year-old boy presents after recurrent unprovoked tonic-clonic seizures.',options:['Epilepsy','Asthma','Diabetes','Anaemia','Depression'],answerIndex:0,explanation:'This patient has epilepsy.'});assert.equal(q.group,'Child Health');assert.equal(q.unit,'Neurology');assert.equal(q.chapter,'Epilepsy and non-febrile seizures');
 const a=m.tagQuestion({question:'A 65-year-old man has right sided weakness and dysphasia.',options:['Stroke','Asthma','Diabetes','Anaemia','Depression'],answerIndex:0,explanation:'This is an acute ischaemic stroke.'});assert.equal(a.group,'Adult Health - Medicine');assert.equal(a.unit,'Neurology');
});

test('distractor disease names do not decide the chapter',async()=>{
 const m=await import('../src/taxonomy.js');
 const q=m.tagQuestion({question:'A 40-year-old man has crushing central chest pain and ST elevation. He has a past history of asthma and epilepsy. Which one of the following is the most appropriate next step?',options:['Aspirin and urgent reperfusion','Salbutamol','Levetiracetam','Antibiotics','Reassure'],answerIndex:0,explanation:'This is an acute myocardial infarction needing urgent reperfusion.'});
 assert.equal(q.unit,'Cardiovascular');assert.equal(q.chapter,'Acute coronary syndromes');
});
test('pregnancy, ethics and unclear questions are handled explicitly',async()=>{
 const m=await import('../src/taxonomy.js');
 assert.equal(m.tagQuestion({question:'A 16-year-old is 10 weeks pregnant and requests a termination. She has capacity.',options:['Ectopic','Miscarriage','Other','x','y'],answerIndex:1,explanation:'Early pregnancy problem.'}).group,'Women’s Health - O&G');
 const e=m.tagQuestion({question:'A 45-year-old patient refuses treatment. Which is correct about consent and confidentiality?',options:['Respect a capacitous refusal','a','b','c','d'],answerIndex:0,explanation:'Consent and capacity apply.'});assert.equal(e.group,'Population Health & Ethics');
 const u=m.tagQuestion({question:'A 30-year-old is seen.',options:['a','b','c','d','e'],answerIndex:0,explanation:''});assert.equal(u.unit,'Unclassified');assert.equal(u.classificationUncertain,true);
});
test('tree totals reconcile and count each question once',async()=>{
 const m=await import('../src/taxonomy.js');
 const qs=[{id:'1',group:'Child Health',unit:'Neurology',chapter:'Epilepsy'},{id:'2',group:'Child Health',unit:'Neurology',chapter:'Febrile seizures'},{id:'3',group:'Child Health',unit:'Respiratory',chapter:'Asthma'}];
 const t=m.buildTree(qs,new Set(['1']));const g=t[0];assert.equal(g.total,3);assert.equal(g.unseen,2);assert.equal(g.units.reduce((a,u)=>a+u.total,0),g.total);assert.equal(g.units[0].chapters.reduce((a,c)=>a+c.total,0),g.units[0].total);
});

const TREE=[{name:'Child Health',total:3,unseen:3,units:[{name:'Neurology',total:2,unseen:2,chapters:[{name:'Epilepsy',key:'Child Health|Neurology|Epilepsy',total:1},{name:'Febrile',key:'Child Health|Neurology|Febrile',total:1}]},{name:'Respiratory',total:1,unseen:1,chapters:[{name:'Asthma',key:'Child Health|Respiratory|Asthma',total:1}]}]}];
test('selecting a unit selects its chapters; unticking one chapter keeps the siblings',async()=>{
 const m=await import('../src/taxonomy.js');
 let p=m.toggleKey(TREE,[], 'Child Health|Neurology');assert.deepEqual(p,['Child Health|Neurology']);assert.equal(m.isSelected(p,'Child Health|Neurology|Epilepsy'),true);assert.equal(m.countSelected(TREE,p),2);
 p=m.toggleKey(TREE,p,'Child Health|Neurology|Febrile');assert.deepEqual(p,['Child Health|Neurology|Epilepsy']);assert.equal(m.countSelected(TREE,p),1);
 p=m.toggleKey(TREE,[], 'Child Health');p=m.toggleKey(TREE,p,'Child Health|Respiratory');assert.equal(m.countSelected(TREE,p),2);assert.equal(m.isSelected(p,'Child Health|Respiratory|Asthma'),false);
});

test('a word in the history alone never decides the chapter',async()=>{
 const m=await import('../src/taxonomy.js');
 const q=m.tagQuestion({question:'A 6-year-old boy with a past history of a febrile seizure presents with fatigue and pallor. Blood film shows spherocytes. Which one of the following is the most likely diagnosis?',options:['Autoimmune haemolytic anaemia','Epilepsy','Migraine','x','y'],answerIndex:0,explanation:'Haemolysis with spherocytes.'});
 assert.notEqual(q.chapter,'Epilepsy and non-febrile seizures');assert.equal(q.unit,'Haematology and oncology');
});
