import test from 'node:test';
import assert from 'node:assert/strict';
import * as k from '../src/knowledge094.js';
test('library composes metadata and subject filters without mutation',()=>{
 const d=[{id:'a',name:'Heart',author:'Smith',subject:'Medicine',addedAt:2},{id:'b',name:'Heart',author:'Smith',subject:'Surgery',addedAt:3}];
 assert.equal(typeof k.k094FilterDocs,'function');
 assert.deepEqual(k.k094FilterDocs(d,{query:'smith',subject:'Medicine'}).map(x=>x.id),['a']);
 assert.deepEqual(k.k094FilterDocs(d,{sort:'recent'}).map(x=>x.id),['b','a']);
 assert.deepEqual(d.map(x=>x.id),['a','b']);
});
test('topic filters count distinct books and compose chapters and query',()=>{
 assert.equal(typeof k.k094FilterTopics,'function');
 const t=[{title:'Heart failure',level:1,refs:[{docId:'a'},{docId:'a'}]},{title:'Heart disease',level:1,refs:[{docId:'a'},{docId:'b'}]},{title:'Heart valves',level:2,refs:[{docId:'a'},{docId:'b'}]}];
 assert.deepEqual(k.k094FilterTopics(t,{query:'heart',chapters:true,multi:true}).map(x=>x.title),['Heart disease']);
});
test('model scopes lexical retrieval and preserves exact action provenance',async()=>{
 assert.equal(typeof k.k094Model,'function');
 const events=[],calls=[];
 const docs=[{id:'a',name:'Book A',subject:'Medicine'},{id:'b',name:'Book B',subject:'Surgery'}];
 const passage={docId:'a',page:17,text:'Real source text',score:2};
 const model=k.k094Model({bridge:{docs:async()=>docs,searchIndex:async ds=>{calls.push(ds);return {passages:[passage]};},searchPassages:(idx,q,n)=>{calls.push([q,n]);return [passage];},uid:()=> 'h1',saveHighlight:async h=>calls.push(h)},dispatch:(n,d)=>events.push([n,d])});
 const result=await model.search('heart',['MI'],{subject:'Medicine'});
 assert.deepEqual(calls[0],docs.slice(0,1));assert.equal(result.hits[0].page,17);
 model.open(passage);model.ask('heart','Medicine');model.generate('heart','Medicine',passage);
 assert.deepEqual(events,[['amc-open-doc',{docId:'a',page:17}],['amc-ask-seed',{query:'heart',subject:'Medicine',mode:'books'}],['amc-generate',{query:'heart',subject:'Medicine',n:5,passage}]]);
 const h=await model.highlight(passage,docs[0]);assert.equal(h.source.page,17);assert.equal(h.source.docId,'a');assert.equal(h.text,passage.text);
});
test('all three screen mounts are exported',()=>{
 for(const name of ['mountLibrary094','mountSearch094','mountTopics094'])assert.equal(typeof k[name],'function',name);
});
