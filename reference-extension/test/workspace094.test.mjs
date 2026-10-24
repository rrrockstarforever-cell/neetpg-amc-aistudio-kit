import test from 'node:test';
import assert from 'node:assert/strict';
import * as ws from '../src/workspace.js';
export function fixture(){
 const highlights=[],cards=[],atts=new Map(),events=[];
 const deps={bridge:{highlights:async()=>structuredClone(highlights),saveHighlight:async h=>{const i=highlights.findIndex(x=>x.id===h.id);i<0?highlights.push(structuredClone(h)):highlights.splice(i,1,structuredClone(h));},deleteHighlight:async id=>highlights.splice(highlights.findIndex(h=>h.id===id),1),cards:async()=>structuredClone(cards),createCard:async c=>{if(cards.some(x=>x.id===c.id))return false;cards.push({...structuredClone(c),card:{state:0},due:0});return true;}},getAtt:async id=>structuredClone(atts.get(id)),putAtt:async a=>{atts.set(a.id,structuredClone(a));return a;},now:()=>1000,uid:(()=>{let i=0;return()=>`id${++i}`;})(),dispatch:(name,detail)=>events.push({name,detail}),confirm:()=>true,download:async()=>true};
 return {deps,highlights,cards,atts,events};
}
test('quick capture CRUD composes filters and preserves private notes and source page',async()=>{
 assert.equal(typeof ws.cfWsModel,'function');const f=fixture(),m=ws.cfWsModel(f.deps);
 await assert.rejects(()=>m.saveHighlight({text:'  '}),/text/i);
 const h=await m.saveHighlight({text:'<script>Renal</script>',subject:'Medicine',source:{docId:'book',page:17,label:'Book'},thread:[]});
 await m.saveHighlight({...h,starred:true,memoryNote:'private'});
 assert.equal((await m.highlights({query:'renal',subject:'Medicine',starred:true})).length,1);
 assert.equal((await m.highlights({query:'renal',subject:'Surgery'})).length,0);
 m.openSource(h);assert.deepEqual(f.events[0],{name:'amc-open-doc',detail:{docId:'book',page:17}});
 await m.convertHighlight(h.id);await m.convertHighlight(h.id);
 assert.equal(f.cards.length,1);assert.equal(f.cards[0].kind,'basic');assert.equal(f.cards[0].text,h.text);assert.equal(f.cards[0].source.page,17);
 assert.equal(f.highlights[0].memoryNote,'private');await m.deleteHighlight(h.id);assert.equal(f.highlights.length,0);
});

test('SRS delegates FSRS, requires reveal and valid ratings, retains card after errors',async()=>{
 const f=fixture();f.cards.push({id:'c',text:'front',explanation:'back',due:0,card:{state:0}});
 let rated;f.deps.bridge.previewCard=()=>[{g:3,label:'Good',due:new Date(2000)}];
 f.deps.bridge.rateCard=(c,g)=>{rated=g;return {...c,due:9000,card:{state:2}};};
 f.deps.bridge.saveCard=async c=>{f.cards[0]=c;};
 const m=ws.cfWsModel(f.deps);assert.equal(typeof m.review,'function');
 await assert.rejects(()=>m.review('c',3,false),/reveal/i);await assert.rejects(()=>m.review('c',5,true),/rating/i);
 assert.equal((await m.dueCards()).length,1);assert.equal((await m.preview(f.cards[0]))[0].g,3);
 await m.review('c',3,true);assert.equal(rated,3);assert.equal((await m.dueCards()).length,0);
 f.cards[0].due=0;f.deps.bridge.rateCard=()=>{throw Error('FSRS failed');};
 await assert.rejects(()=>m.review('c',1,true),/FSRS failed/);assert.equal((await m.dueCards()).length,1);
});

test('research persists genuine native captures and URL provenance, edits notes, sends chat and highlights',async()=>{
 const f=fixture();f.deps.native={browser:{text:async()=>({url:'https://example.org/paper',title:'Paper',text:'Actual selected body'}),capture:async()=>'data:image/png;base64,aGVsbG8='}};
 const m=ws.cfWsModel(f.deps);assert.equal(typeof m.capture,'function');
 const c=await m.capture('text');assert.equal((await m.captures())[0].text,'Actual selected body');
 await m.saveCapture({...c,note:'Remember'});m.sendChat(c);assert.match(f.events[0].detail.text,/https:\/\/example.org/);
 await m.captureHighlight(c.id);assert.equal(f.highlights[0].source.url,c.url);
 const image=await m.capture('image');assert.ok(image.imageRef);assert.ok(f.atts.get(image.imageRef).data);
 f.deps.native.browser.text=async()=>{throw Error('No page');};await assert.rejects(()=>m.capture('text'),/No page/);assert.equal((await m.captures()).length,2);
 await m.deleteCapture(c.id);assert.equal((await m.captures()).length,1);
});

test('versioned backup whitelists data, merge preserves existing schedules, TSV is genuine escaped text',async()=>{
 const f=fixture();
 f.highlights.push({id:'h',text:'pearl',apiKey:'LEAK1',subject:'Medicine'});
 f.cards.push({id:'c',kind:'basic',text:'A\tB',explanation:'<back>\nline',due:123,card:{state:2,stability:7},token:'LEAK2',subject:'Medicine'});
 const notes=[{id:'n',text:'note',apiKey:'LEAK3'}],savedNotes=[];
 f.deps.bridge.notes=async()=>notes;f.deps.bridge.saveNote=async n=>{savedNotes.push(n);};
 const m=ws.cfWsModel(f.deps),b=await m.backup();
 assert.equal(b.schema,'amc-ext-export');assert.equal(b.version,1);
 assert.ok(!JSON.stringify(b).includes('LEAK'));
 assert.equal(b.cards[0].card.stability,7);
 const tsv=await m.ankiTsv();assert.ok(tsv.startsWith('#separator:tab'));
 assert.ok(!tsv.split('\n').slice(3).some(l=>l.split('\t').length!==3));
 assert.ok(tsv.includes('&lt;back&gt;<br>line'));
 const incoming={schema:'amc-ext-export',version:1,notes:[{id:'n',text:'changed'},{id:'n2',text:'new note'}],pearls:[{id:'h',text:'overwrite?'},{id:'h2',text:'new pearl'},{id:'',text:'bad'}],cards:[{id:'c',kind:'basic',text:'x',due:1,card:{state:0}},{id:'c2',kind:'basic',text:'fresh',due:5}]};
 const dry=await m.importData(incoming,false);
 assert.equal(dry.notes.added,1);assert.equal(dry.notes.skipped,1);assert.equal(dry.pearls.invalid,1);assert.equal(savedNotes.length,0);
 const done=await m.importData(incoming,true);
 assert.equal(done.cards.added,1);assert.equal(f.cards.find(c=>c.id==='c').due,123);
 assert.equal(f.highlights.find(h=>h.id==='h').text,'pearl');
 await assert.rejects(()=>m.importData({schema:'other',version:1}),/schema/i);
 await assert.rejects(()=>m.importData({schema:'amc-ext-export',version:1,notes:[],pearls:[],cards:'x'}),/Invalid/);
});

class Element{
 constructor(tag){this.tagName=tag.toLowerCase();this.children=[];this.textContent='';this.attributes={};this.listeners={};this.className='';this.value='';this.disabled=false;}
 append(...n){this.children.push(...n);}
 replaceChildren(...n){this.children=[...n];}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,fn){this.listeners[k]=fn;}
 removeEventListener(k,fn){if(this.listeners[k]===fn)delete this.listeners[k];}
 async click(){if(!this.disabled)return this.listeners.click?.({target:this,preventDefault(){}});}
 get all(){return [this,...this.children.filter(x=>x instanceof Element).flatMap(x=>x.all)];}
 get text(){return this.textContent+this.children.map(x=>x.text??x).join(' ');}
}
function domFixture(){const f=fixture();f.deps.document={createElement:t=>new Element(t)};f.el=new Element('main');f.button=t=>f.el.all.find(x=>x.tagName==='button'&&x.textContent===t);return f;}
test('highlights screen captures safely and handles delete confirmation and teardown',async()=>{
 assert.equal(typeof ws.mountHighlights094,'function');const f=domFixture();const life=ws.mountHighlights094(f.el,f.deps);await life.ready;
 const field=n=>f.el.all.find(x=>x.attributes['aria-label']===n);
 field('Pearl text').value='<img src=x onerror=alert(1)>';field('Citation').value='Source';field('Subject').value='Medicine';await f.button('Save pearl').click();
 assert.equal(f.highlights.length,1);assert.ok(f.el.text.includes('<img src=x'));assert.equal(f.el.all.some(x=>x.tagName==='img'),false);
 f.deps.confirm=()=>false;await f.button('Delete').click();assert.equal(f.highlights.length,1);
 f.deps.confirm=()=>true;await f.button('Delete').click();assert.equal(f.highlights.length,0);
 life.destroy();assert.equal(f.el.children.length,0);
});

test('SRS screen reveals before rating, previews actual intervals, then advances',async()=>{
 assert.equal(typeof ws.mountSrs094,'function');const f=domFixture();f.cards.push({id:'c',kind:'mcq',text:'front',options:['alpha','beta'],correct:1,explanation:'rationale',card:{state:0},due:0});
 f.deps.bridge.previewCard=()=>[1,2,3,4].map(g=>({g,label:['Again','Hard','Good','Easy'][g-1],due:new Date(1000+g*60000)}));f.deps.bridge.rateCard=(c,g)=>({...c,due:9999,grade:g});f.deps.bridge.saveCard=async c=>f.cards.splice(0,1,c);
 const life=ws.mountSrs094(f.el,f.deps);await life.ready;assert.ok(!f.el.text.includes('rationale'));assert.ok(!f.button('Good'));
 await f.button('Reveal answer').click();assert.ok(f.el.text.includes('rationale'));assert.ok(f.el.text.includes('beta'));await f.button('Good').click();assert.equal(f.cards[0].grade,3);assert.ok(f.el.text.includes('No cards due'));life.destroy();
});
test('research and storage mount as separate panels without touching native view bounds',async()=>{
 assert.equal(typeof ws.mountResearch094,'function');assert.equal(typeof ws.mountStorage094,'function');const f=domFixture();let bounds=0;
 f.deps.native={browser:{setBounds:()=>bounds++,text:async()=>({url:'https://example.org',title:'Evidence',text:'real text'})}};
 const life=ws.mountResearch094(f.el,f.deps);await life.ready;await f.button('Capture page text').click();assert.ok(f.el.text.includes('real text'));assert.equal(bounds,0);await f.button('Send to chat').click();assert.match(f.events[0].detail.text,/example.org/);life.destroy();
 const g=domFixture();g.deps.bridge.notes=async()=>[];const storage=ws.mountStorage094(g.el,g.deps);await storage.ready;assert.ok(g.button('Export backup JSON'));assert.ok(!g.el.text.toLowerCase().includes('clear all'));storage.destroy();
});
