import { getAtt, putAtt } from './store.js';

// All internals are prefixed: the host concatenates modules into one scope.
export function cfWsModel(deps = {}) {
 const now=deps.now||Date.now, uid=deps.uid||(()=>globalThis.crypto.randomUUID());
 const call=async(name,...args)=>{const b=deps.bridge||globalThis.window?.__amcBridge;if(typeof b?.[name]!=='function')throw Error('Bridge unavailable: '+name);return await b[name](...args);};
 const dispatch=deps.dispatch||((name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail})));
 const model={call,now,uid,
 async highlights(f={}){return (await call('highlights')).filter(h=>(!f.subject||h.subject===f.subject)&&(!f.starred||h.starred)&&(!f.query||[h.text,h.subject,h.memoryNote,h.source?.label,...(h.thread||[]).map(t=>t.text)].join(' ').toLowerCase().includes(f.query.trim().toLowerCase())));},
 async saveHighlight(h){if(!h.text?.trim())throw Error('Highlight text is required');const row={...h,id:h.id||uid(),text:h.text.trim(),createdAt:h.createdAt??now(),updatedAt:now(),thread:h.thread||[],source:h.source||{label:''}};await call('saveHighlight',row);return row;},
 deleteHighlight:id=>call('deleteHighlight',id),
 openSource(h){if(h.source?.docId)dispatch('amc-open-doc',{docId:h.source.docId,page:h.source.page??1});},
 async convertHighlight(id){const h=(await call('highlights')).find(x=>x.id===id);if(!h)throw Error('Highlight no longer exists');const cardId='highlight:'+id;await call('createCard',{id:cardId,kind:'basic',text:h.text,explanation:h.memoryNote||h.source?.label||'',subject:h.subject||'',source:h.source,highlightId:id});await model.saveHighlight({...h,srsCardIds:[...new Set([...(h.srsCardIds||[]),cardId])]});return cardId;}
 };
 model.dueCards=async()=> (await call('cards')).filter(c=>Number.isFinite(c.due)&&c.due<=now()).sort((a,b)=>a.due-b.due);
 model.preview=c=>call('previewCard',c);
 model.review=async(id,rating,revealed)=>{if(!revealed)throw Error('Reveal the answer first');if(![1,2,3,4].includes(rating))throw Error('Invalid rating');const c=(await call('cards')).find(c=>c.id===id);if(!c)throw Error('Card not found');const next=await call('rateCard',c,rating);await call('saveCard',next);return next;};
 const get=deps.getAtt||getAtt,put=deps.putAtt||putAtt;
 let queue=Promise.resolve();const serialized=fn=>{const next=queue.catch(()=>{}).then(fn);queue=next;return next;};
 model.captures=async()=> (await get('workspace094:research'))?.rows||[];
 model.saveCapture=c=>serialized(async()=>{const rows=await model.captures(),index=rows.findIndex(x=>x.id===c.id);if(index<0)rows.unshift(c);else rows[index]=c;await put({id:'workspace094:research',version:1,rows});return c;});
 model.capture=async kind=>{const browser=(deps.native||globalThis.window?.native)?.browser;if(!browser?.text)throw Error('Native browser unavailable');const page=await browser.text();if(!page?.url)throw Error('No browser page loaded');const c={id:uid(),title:page.title||'',url:page.url,text:kind==='text'?page.text||'':'',note:'',capturedAt:now()};if(kind==='image'){if(!browser.capture)throw Error('Screenshot unavailable');const data=await browser.capture();if(typeof data!=='string'||!data)throw Error('Empty screenshot');c.imageRef='workspace094:image:'+c.id;await put({id:c.imageRef,data:data.startsWith('data:')?data:'data:image/png;base64,'+data});}else if(!c.text.trim())throw Error('Page has no captured text');return model.saveCapture(c);};
 model.deleteCapture=id=>serialized(async()=>{await put({id:'workspace094:research',version:1,rows:(await model.captures()).filter(c=>c.id!==id)});});
 model.sendChat=c=>dispatch('amc-chat-seed',{text:[c.text,c.note,c.title,c.url].filter(Boolean).join('\n\n')});
 model.captureHighlight=async id=>{const c=(await model.captures()).find(x=>x.id===id);if(!c)throw Error('Capture not found');return model.saveHighlight({id:'capture:'+id,text:c.text||c.note||c.title,source:{label:c.title,url:c.url,capturedAt:c.capturedAt},memoryNote:c.note,imageRef:c.imageRef,origin:'research'});};

 const fields={pearls:['id','text','createdAt','updatedAt','subject','starred','memoryNote','srsCardIds','origin'],cards:['id','kind','text','options','correct','explanation','subject','topic','highlightId','createdAt','due'],notes:['id','text','title','subject','topic','docId','createdAt','updatedAt','html','content','exam']};
 const clean=(r,type)=>{const o={};for(const k of fields[type])if(r[k]!==undefined)o[k]=structuredClone(r[k]);if(r.source)o.source=Object.fromEntries(['label','docId','page','url','capturedAt'].filter(k=>r.source[k]!==undefined).map(k=>[k,r.source[k]]));if(type==='cards'&&r.card)o.card=Object.fromEntries(['due','stability','difficulty','elapsed_days','scheduled_days','reps','lapses','learning_steps','state','last_review'].filter(k=>r.card[k]!==undefined).map(k=>[k,r.card[k]]));return o;};
 const download=(...args)=>(deps.download||cfWsDownload)(...args);
 model.backup=async()=>({schema:'amc-ext-export',version:1,exportedAt:now(),notes:(await call('notes')).map(r=>clean(r,'notes')),pearls:(await call('highlights')).map(r=>clean(r,'pearls')),cards:(await call('cards')).map(r=>clean(r,'cards'))});
 model.importData=async(input,apply=false)=>{if(typeof input==='string'){if(input.length>20*1024*1024)throw Error('Import exceeds 20 MB');input=JSON.parse(input);}if(input?.schema!=='amc-ext-export'||input.version!==1)throw Error('Unsupported import schema/version');
 const report={};for(const [type,listName,saveName] of [['notes','notes','saveNote'],['pearls','highlights','saveHighlight'],['cards','cards','createCard']]){if(!Array.isArray(input[type])||input[type].length>50000)throw Error('Invalid '+type+' array');report[type]={added:0,skipped:0,invalid:0,errors:[]};}
 // Validate all top-level arrays before making any writes. Existing IDs are never overwritten.
 for(const [type,listName,saveName] of [['notes','notes','saveNote'],['pearls','highlights','saveHighlight'],['cards','cards','createCard']]){const ids=new Set((await call(listName)).map(r=>r.id));for(const r of input[type]){if(!r||typeof r.id!=='string'||!r.id||r.id.length>300||typeof r.text!=='string'||!r.text.trim()||(type==='cards'&&!['basic','mcq','mock'].includes(r.kind))){report[type].invalid++;continue;}if(ids.has(r.id)){report[type].skipped++;continue;}ids.add(r.id);const row=clean(r,type);if(type==='cards'){delete row.card;delete row.due;if(row.kind!=='basic'&&(!Array.isArray(row.options)||!Number.isInteger(row.correct)||row.correct<0||row.correct>=row.options.length)){report[type].invalid++;continue;}}try{if(apply)await call(saveName,row);report[type].added++;}catch(e){report[type].errors.push(r.id+': '+e.message);}}}return report;};
 model.ankiTsv=async()=>{const cell=t=>cfWsEscape(String(t??'')).replace(/\t/g,' ').replace(/\r?\n/g,'<br>');return '#separator:tab\n#html:true\n#tags column:3\n'+(await call('cards')).map(c=>[cell([c.text,...(c.options||[]).map((x,i)=>String.fromCharCode(65+i)+'. '+x)].join('\n')),cell([c.options?.[c.correct],c.explanation].filter(Boolean).join('\n')),cell((c.subject||'').replace(/\s/g,'_'))].join('\t')).join('\n');};
 model.exportFile=async kind=>{if(kind==='tsv')return download(await model.ankiTsv(),'clinical-focus-anki.tsv','text/tab-separated-values');if(kind==='pdf'){const native=deps.native||globalThis.window?.native;if(!native?.savePdf)throw Error('Native PDF export unavailable');const rows=await call('highlights');return native.savePdf('<!doctype html><meta charset="utf-8"><h1>Clinical Highlights</h1>'+rows.map(h=>'<article><p>'+cfWsEscape(h.text)+'</p><small>'+cfWsEscape(h.source?.label||'')+'</small></article>').join(''),'Clinical Highlights.pdf');}return download(JSON.stringify(await model.backup(),null,2),'clinical-focus-backup-v1.json','application/json');};
 model.resetSchedules=async()=>{if(!await (deps.confirm||globalThis.window?.confirm)?.('Reset all SRS schedules? Card content stays. A backup will be saved first.'))return 0;const cards=await call('cards');const backup={schema:'amc-srs-backup',version:1,exportedAt:now(),cards};await put({id:'workspace094:srs-backup',...backup});if(await download(JSON.stringify(backup,null,2),'srs-before-reset.json','application/json')===false)throw Error('Backup download cancelled');for(const c of cards)await call('saveCard',{...c,due:now(),card:{due:new Date(now()),stability:0,difficulty:0,elapsed_days:0,scheduled_days:0,reps:0,lapses:0,learning_steps:0,state:0}});return cards.length;};

 return model;
}

export function cfWsEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export async function cfWsDownload(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));try{const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();return true;}finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}}

export function cfWsScreen(el,title,deps={}){
 const doc=deps.document||document, model=cfWsModel(deps);let alive=true;const cleanups=[];
 const node=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const root=node('section',undefined,'cf-workspace cf-workspace094');root.append(node('h1',title));const status=node('p','Loading…','cf-status');status.setAttribute('role','status');root.append(status);const body=node('div',undefined,'cf-workspace-body');root.append(body);el.replaceChildren(root);
 const run=async fn=>{if(!alive)return;try{status.textContent='';return await fn();}catch(e){if(alive)status.textContent=e.message||String(e);}};
 const button=(label,fn)=>{const b=node('button',label,'btn');b.type='button';const cb=()=>run(async()=>{b.disabled=true;try{return await fn();}finally{b.disabled=false;}});b.addEventListener('click',cb);cleanups.push(()=>b.removeEventListener('click',cb));return b;};
 const input=(label,tag='input',value='')=>{const n=node(tag);n.value=value;n.setAttribute('aria-label',label);n.placeholder=label;return n;};
 const confirm=msg=>(deps.confirm||globalThis.window?.confirm)?.(msg);
 const life={ready:null,destroy(){alive=false;for(const fn of cleanups)fn();el.replaceChildren();}};
 return {doc,model,node,root,status,body,button,input,run,confirm,life,get alive(){return alive;},listen(n,event,fn){n.addEventListener(event,fn);cleanups.push(()=>n.removeEventListener(event,fn));}};
}

export function mountHighlights094(el,deps={}){
 const s=cfWsScreen(el,'Clinical Highlights',deps),m=s.model;let query='',subject='',starred=false;const selected=new Set();
 const form=s.node('section',undefined,'cf-card'),text=s.input('Pearl text','textarea'),citation=s.input('Citation'),category=s.input('Subject');
 form.append(s.node('h2','Quick capture'),text,citation,category,s.button('Save pearl',async()=>{await m.saveHighlight({text:text.value,subject:category.value.trim(),source:{label:citation.value.trim()}});text.value='';citation.value='';await render();}));s.body.append(form);
 const toolbar=s.node('div',undefined,'cf-toolbar'),search=s.input('Search highlights'),subjects=s.input('Filter subject','select'),favorites=s.button('Starred only',async()=>{starred=!starred;favorites.setAttribute('aria-pressed',String(starred));await render();});
 toolbar.append(search,subjects,favorites,s.button('Convert selected to SRS',async()=>{if(!selected.size)throw Error('Select at least one highlight');for(const id of selected)await m.convertHighlight(id);selected.clear();await render();}),s.button('Export JSON',()=>m.exportFile('json')),s.button('Export Anki TSV',()=>m.exportFile('tsv')),s.button('Export PDF',()=>m.exportFile('pdf')));s.body.append(toolbar);
 const list=s.node('div',undefined,'cf-highlight-list');s.body.append(list);
 s.listen(search,'input',()=>{query=search.value;s.run(render);});s.listen(subjects,'change',()=>{subject=subjects.value;s.run(render);});
 async function render(){const all=await m.highlights(),rows=await m.highlights({query,subject,starred});if(!s.alive)return;const opts=[s.node('option','All subjects')];opts[0].value='';for(const name of [...new Set(all.map(h=>h.subject).filter(Boolean))].sort()){const opt=s.node('option',name);opt.value=name;opts.push(opt);}subjects.replaceChildren(...opts);subjects.value=subject;list.replaceChildren();s.status.textContent=`${rows.length} of ${all.length} saved highlights`;
 for(const h of rows){const card=s.node('article',undefined,'cf-card');const checkbox=s.input('Select highlight','input');checkbox.type='checkbox';checkbox.checked=selected.has(h.id);s.listen(checkbox,'change',()=>checkbox.checked?selected.add(h.id):selected.delete(h.id));card.append(checkbox,s.node('p',h.text,'cf-quote'),s.node('small',[h.subject,h.source?.label].filter(Boolean).join(' · ')));
 if(h.source?.docId)card.append(s.button('Open source page',()=>m.openSource(h)));
 if(/^https?:\/\//i.test(h.source?.url||'')){const link=s.node('a','Source website');link.href=h.source.url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
 const editText=s.input('Edit pearl text','textarea',h.text),editSubject=s.input('Edit subject','input',h.subject||''),note=s.input('Private note','textarea',h.memoryNote||'');card.append(editText,editSubject,note,s.button('Save changes',async()=>{await m.saveHighlight({...h,text:editText.value,subject:editSubject.value,memoryNote:note.value});await render();}),s.button(h.starred?'Unstar':'Star',async()=>{await m.saveHighlight({...h,starred:!h.starred});await render();}),s.button('Send to SRS',async()=>{await m.convertHighlight(h.id);await render();}),s.button('Delete',async()=>{if(await s.confirm('Delete this highlight? Linked SRS cards are retained.')){await m.deleteHighlight(h.id);selected.delete(h.id);await render();}}));list.append(card);}
 if(!rows.length)list.append(s.node('p','No matching highlights. Capture a pearl to begin.'));}
 s.life.ready=s.run(render);return s.life;
}

export function mountSrs094(el,deps={}){
 const s=cfWsScreen(el,'Flashcards & spaced repetition',deps),m=s.model;let revealed=false,current=null;
 const card=s.node('article',undefined,'cf-card cf-srs-card'),bar=s.node('div',undefined,'cf-toolbar');s.body.append(card,bar);
 async function render(){const due=await m.dueCards(),all=await m.call('cards');if(!s.alive)return;current=due[0]||null;card.replaceChildren();bar.replaceChildren();
  s.status.textContent=`${due.length} due now · ${all.length} cards in total`;
  if(!current){card.append(s.node('h2','No cards due'),s.node('p','Use “Review later” on any question, or send a highlight to SRS, and it will come back on a schedule.','muted'));revealed=false;return;}
  card.append(s.node('small',[current.subject,current.topic].filter(Boolean).join(' · ')),s.node('p',current.text,'cf-quote'));
  if(Array.isArray(current.options)){const ol=s.node('ol');ol.type='A';for(const o of current.options)ol.append(s.node('li',o));card.append(ol);}
  if(!revealed){bar.append(s.button('Reveal answer',async()=>{revealed=true;await render();}));return;}
  const ans=[Array.isArray(current.options)&&current.options[current.correct]!==undefined?'Answer: '+current.options[current.correct]:'',current.explanation].filter(Boolean);
  const note=s.node('div',undefined,'cf-note');note.append(...ans.map(t=>s.node('p',t)));card.append(note);
  const prev=await m.preview(current);
  for(const r of prev){bar.append(s.button(r.label,async()=>{await m.review(current.id,r.g,true);revealed=false;await render();}),s.node('small','next '+new Date(r.due).toLocaleString(),'muted'));}
  bar.append(s.button('Remove card',async()=>{if(await s.confirm('Remove this card from your schedule?')){await m.call('deleteCard',current.id);revealed=false;await render();}}));
 }
 s.life.ready=s.run(render);return s.life;
}

export function mountResearch094(el,deps={}){
 const s=cfWsScreen(el,'Research scratchpad',deps),m=s.model;
 s.body.append(s.node('p','Captures come from the Research browser page that is currently open. Pages and screenshots are stored on this device with their address.','muted'));
 const bar=s.node('div',undefined,'cf-toolbar'),list=s.node('div',undefined,'cf-highlight-list');s.body.append(bar,list);
 const go=s.button('Open research browser',()=>(deps.dispatch||((n,d)=>window.dispatchEvent(new CustomEvent(n,{detail:d}))))('amc-go',{view:'browser'}));
 bar.append(s.button('Capture page text',async()=>{await m.capture('text');await render();}),s.button('Capture screenshot',async()=>{await m.capture('image');await render();}),go);
 async function render(){const rows=await m.captures();if(!s.alive)return;list.replaceChildren();s.status.textContent=`${rows.length} saved capture${rows.length===1?'':'s'}`;
  for(const c of rows){const card=s.node('article',undefined,'cf-card');card.append(s.node('h3',c.title||'Untitled page'));
   if(/^https?:\/\//i.test(c.url||'')){const a=s.node('a',c.url);a.href=c.url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
   if(c.text)card.append(s.node('p',c.text.slice(0,1200),'cf-quote'));
   if(c.imageRef)card.append(s.node('small','Screenshot saved on this device.','muted'));
   const note=s.input('Private note','textarea',c.note||'');
   card.append(note,s.button('Save note',async()=>{await m.saveCapture({...c,note:note.value});await render();}),s.button('Send to chat',async()=>{m.sendChat(c);}),s.button('Save as highlight',async()=>{await m.captureHighlight(c.id);}),s.button('Delete',async()=>{if(await s.confirm('Delete this capture?')){await m.deleteCapture(c.id);await render();}}));
   list.append(card);}
  if(!rows.length)list.append(s.node('p','No captures yet. Open the Research browser, load a page, then capture it here.'));}
 s.life.ready=s.run(render);return s.life;
}

export function mountStorage094(el,deps={}){
 const s=cfWsScreen(el,'Data & exports',deps),m=s.model;
 s.body.append(s.node('p','Backups contain your notes, saved pearls and flashcards. API keys, sign-in tokens and settings are never included. Importing adds missing items and never overwrites what you already have.','muted'));
 const bar=s.node('div',undefined,'cf-toolbar'),report=s.node('pre',undefined,'cf-card');
 const file=s.input('Backup file','input');file.type='file';file.accept='.json,application/json';
 bar.append(s.button('Export backup JSON',()=>m.exportFile('json')),s.button('Export Anki TSV',()=>m.exportFile('tsv')),s.button('Export highlights PDF',()=>m.exportFile('pdf')),file,
  s.button('Preview import',async()=>{const f=file.files?.[0];if(!f)throw Error('Choose a backup file first');report.textContent='Preview only, nothing written:\n'+JSON.stringify(await m.importData(await f.text(),false),null,1);}),
  s.button('Import (merge)',async()=>{const f=file.files?.[0];if(!f)throw Error('Choose a backup file first');if(!await s.confirm('Add the missing items from this backup? Existing items stay unchanged.'))return;report.textContent='Imported:\n'+JSON.stringify(await m.importData(await f.text(),true),null,1);}),
  s.button('Reset flashcard schedules',async()=>{const n=await m.resetSchedules();if(n)s.status.textContent=`Reset ${n} card schedules. A backup file was saved first.`;}));
 s.body.append(bar,report);
 s.life.ready=s.run(async()=>{const [n,h,c]=await Promise.all([m.call('notes'),m.call('highlights'),m.call('cards')]);if(s.alive)s.status.textContent=`${n.length} notes · ${h.length} pearls · ${c.length} cards on this device`;});return s.life;
}

