// Knowledge screens: unique prefix is required by the classic-script concatenator.
export function k094FilterDocs(docs, {query='',subject='',sort='name',bookId=''}={}) {
 const q=query.trim().toLowerCase();
 return docs.filter(d=>(!subject||d.subject===subject)&&(!bookId||d.id===bookId)&&(!q||[d.name,d.author,d.edition,d.subject].join(' ').toLowerCase().includes(q))).slice().sort((a,b)=>sort==='recent'?(b.addedAt||0)-(a.addedAt||0):sort==='size'?(b.size||0)-(a.size||0):String(a.name||'').localeCompare(String(b.name||'')));
}
export function k094FilterTopics(topics,{query='',chapters=false,multi=false}={}) {
 const q=query.trim().toLowerCase();
 return topics.filter(t=>(!chapters||t.level===1)&&(!multi||new Set(t.refs.map(r=>r.docId)).size>=2)&&(!q||[t.title,...t.refs.map(r=>r.title)].join(' ').toLowerCase().includes(q)));
}
export function k094Model(deps={}) {
 const bridge=()=>deps.bridge||window.__amcBridge;
 const call=async(name,...args)=>{const b=bridge();if(typeof b?.[name]!=='function')throw Error('Bridge unavailable: '+name);return b[name](...args);};
 const dispatch=deps.dispatch||((name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail})));
 return {call,bridge,
 async search(query,terms=[],scope={}){const docs=k094FilterDocs(await call('docs'),scope);const index=await call('searchIndex',docs);const hits=await call('searchPassages',index,[query,...terms].join(' '),index.passages.length);return {docs,hits,passages:index.passages.length};},
 open(p){dispatch('amc-open-doc',{docId:p.docId,page:p.page||1});},
 ask(query,subject=''){dispatch('amc-ask-seed',{query,subject,mode:'books'});},
 generate(query,subject='',passage){dispatch('amc-generate',{query,subject,n:5,passage});},
 async highlight(p,d){const row={id:await call('uid'),text:p.text,subject:d?.subject||'',createdAt:Date.now(),thread:[],source:{docId:p.docId,page:p.page,label:(d?.name||'Book')+' · p.'+p.page}};await call('saveHighlight',row);return row;}
 };
}

// DOM utilities never parse book, provider or user content as markup.
function k094El(tag,text='',cls='') {const el=document.createElement(tag);el.textContent=text;el.className=cls;return el;}
function k094Input(label,value='',type='text'){const wrap=k094El('label',label+' ','k094-field');const input=k094El('input');input.type=type;if(type==='checkbox')input.checked=!!value;else input.value=value;wrap.append(input);return {wrap,input};}
function k094Select(label,rows,value=''){const wrap=k094El('label',label+' ','k094-field');const input=k094El('select');for(const [v,t] of rows){const o=k094El('option',t);o.value=v;input.append(o);}input.value=value;wrap.append(input);return {wrap,input};}
function k094Store(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function k094Put(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* session remains usable */}}
function k094Shell(root,title,description,deps){root.__k094Dispose?.();root.replaceChildren();const model=k094Model(deps);const shell=k094El('section','','page k094 '+title.toLowerCase()+'094');const head=k094El('header','','page-head');head.append(k094El('h1',title),k094El('p',description,'muted'));const status=k094El('p','','k094-status');status.setAttribute('role','status');const controls=k094El('div','','row k094-controls'),body=k094El('div','','k094-body');shell.append(head,controls,status,body);root.append(shell);let alive=true;const clean=[];
 const ui={model,shell,status,controls,body,alive:()=>alive,cleanup:()=>{alive=false;clean.forEach(fn=>fn());if(root.__k094Dispose===ui.cleanup)delete root.__k094Dispose;},clean,
 say(text){if(alive)status.textContent=text;},
 async run(fn){try{return await fn();}catch(e){ui.say(e.message||String(e));}},
 button(label,fn,parent=controls){const b=k094El('button',label,'btn small');b.type='button';b.addEventListener('click',()=>ui.run(async()=>{b.disabled=true;try{await fn();}finally{if(alive)b.disabled=false;}}));parent.append(b);return b;}};
 root.__k094Dispose=ui.cleanup;return ui;
}
function k094Subjects(docs){return [...new Set(docs.map(d=>d.subject||'').filter(Boolean))].sort();}
function k094Check(ui,name){if(typeof ui.model.bridge()?.[name]!=='function')throw Error('Bridge unavailable: '+name);}
function k094Watch(ui,refresh){const b=ui.model.bridge();if(typeof b?.subscribeJobs==='function')ui.clean.push(b.subscribeJobs(()=>{if(ui.alive())ui.run(refresh);}));}
function k094Jobs(ui,parent,docId){const b=ui.model.bridge();if(typeof b?.jobs!=='function'){parent.append(k094El('p','Job progress unavailable until jobs/subscribeJobs bridge is connected.','muted small'));return false;}
 const job=b.jobs().find(j=>j.docId===docId);if(!job)return false;parent.append(k094El('p',[job.kind,job.status,job.total?`${job.done||0}/${job.total}`:'',job.error||'',job.savedTo||'',job.failed?.length?`${job.failed.length} failed pages`:''].filter(Boolean).join(' · '),'small'));
 if(job.status==='running'){if(b.stopJob)ui.button('Stop job',()=>ui.model.call('stopJob',docId),parent);return true;}return false;
}

export function mountLibrary094(root,deps={}) {
 const ui=k094Shell(root,'Library','Local PDF library · OCR text and source indexes. Index generation uses your configured AI provider.',deps),m=ui.model;
 let docs=[],query='',sort='name',subject='',loading=false;
 const search=k094Input('Search title / author / edition / subject'),order=k094Select('Sort',[['name','Name'],['recent','Recent'],['size','Size']]),scope=k094Select('Subject',[['','All subjects']]);
 ui.controls.append(search.wrap,order.wrap,scope.wrap);
 search.input.oninput=()=>{query=search.input.value;render();};order.input.onchange=()=>{sort=order.input.value;render();};scope.input.onchange=()=>{subject=scope.input.value;render();};
 const file=k094El('input');file.type='file';file.accept='.pdf,application/pdf';file.multiple=true;file.hidden=true;ui.controls.append(file);
 ui.button('Import PDFs',()=>file.click());ui.button('Refresh',refresh);
 async function ingest(files){if(loading)return;loading=true;try{for(const f of files){if(!/\.pdf$/i.test(f.name)){ui.say('Skipped non-PDF: '+f.name);continue;}ui.say('Reading '+f.name+'…');await m.call(typeof m.bridge()?.importBook==='function'?'importBook':'importPdf',f,(done,total)=>ui.say(`Reading ${f.name} · ${done}/${total} pages`));}await refresh();ui.say('Import finished. Review unread-page counts below.');}finally{loading=false;file.value='';}}
 file.onchange=()=>ui.run(()=>ingest(Array.from(file.files)));
 const drop=k094El('div','Drop medical PDFs here or use Import PDFs. No advertised multi-GB limit.','card k094-drop');ui.shell.insertBefore(drop,ui.controls);
 drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();ui.run(()=>ingest(Array.from(e.dataTransfer.files)));};
 ui.button('Detect subjects from content',async()=>{await m.call('classifySubjects',docs);await refresh();});
 ui.button('AI for unclear subjects',async()=>{if(!await m.call('sd'))throw Error('Configure an AI provider in Settings first.');const unclear=docs.filter(d=>!d.subject&&d.subjectSource!=='manual');if(!confirm(`Send first pages of ${unclear.length} books to your configured AI provider for subject classification?`))return;for(const d of unclear)await m.call('classifySubjectAI',d);await refresh();});
 async function refresh(){const next=await m.call('docs');if(!ui.alive())return;docs=next;const rows=[['','All subjects'],...k094Subjects(docs).map(s=>[s,s])];scope.input.replaceChildren(...rows.map(([v,t])=>{const e=k094El('option',t);e.value=v;return e;}));scope.input.value=subject;render();}
 async function job(action,d,force=false){if(action==='indexBook'&&!await m.call('sd'))throw Error('Configure an AI provider in Settings first.');if(action==='indexBook'&&!confirm('Generate / replace this book index using your AI provider? Large books require multiple requests.'))return;if(force&&!confirm('Replace all stored text using OCR? The original PDF is unchanged.'))return;if(action==='searchable'&&!confirm('OCR and save a searchable PDF copy? The original remains unchanged.'))return;await m.call(action,d.id,d.name,force);ui.say('Job requested. See actual job status below; completion is not assumed.');render();}
 function render(){if(!ui.alive())return;ui.body.replaceChildren();const found=k094FilterDocs(docs,{query,sort,subject});ui.body.append(k094El('p',`${found.length} of ${docs.length} books · ${docs.reduce((n,d)=>n+(d.pageCount||0),0)} source pages · ${docs.filter(d=>d.index?.length).length} indexed books`,'muted'));
 if(!found.length)ui.body.append(k094El('p',docs.length?'No books match these filters.':'No books yet. Import a PDF to begin.','empty'));
 const groups=new Map();for(const d of found){const s=d.subject||'Unsorted';if(!groups.has(s))groups.set(s,[]);groups.get(s).push(d);}for(const [s,books] of groups){const section=k094El('section','','k094-subject');section.append(k094El('h2',`${s} · ${books.length}`));const grid=k094El('div','','k094-grid');section.append(grid);ui.body.append(section);for(const d of books){const card=k094El('article','','card doc-card k094-book');grid.append(card);ui.button(d.name||'Untitled PDF',()=>m.open({docId:d.id,page:1}),card);
 card.append(k094El('p',`${d.pageCount??'Unknown'} pages · ${d.size==null?'Unknown size':(d.size/1048576).toFixed(1)+' MB'} · ${d.index?.length||0} index entries`,'small muted'),k094El('p',`${d.needsOcr??'Unknown'} unread pages · ${d.ocrPages??'Unknown'} OCR pages. Check tables and small print.`,'small'));
 const edit=k094El('details');edit.append(k094El('summary','Edit book metadata'));const name=k094Input('Name',d.name||''),author=k094Input('Author',d.author||''),edition=k094Input('Edition',d.edition||''),sub=k094Input('Subject',d.subject||'');edit.append(name.wrap,author.wrap,edition.wrap,sub.wrap);card.append(edit);
 ui.button('Save metadata',async()=>{const value=name.input.value.trim();if(!value)throw Error('Book name cannot be blank.');await m.call('updateDoc',d.id,{name:value.slice(0,500),author:author.input.value.trim().slice(0,500),edition:edition.input.value.trim().slice(0,200),subject:sub.input.value.trim().slice(0,200),subjectSource:'manual'});await refresh();ui.say('Metadata saved.');},edit);
 ui.button('Detect this subject',async()=>{await m.call('detectSubject',d);await refresh();},edit);
 const busy=k094Jobs(ui,card,d.id);const actions=[['Read unread pages (OCR)','ocrBook',false],['Re-read all pages (OCR)','ocrBook',true],[d.index?.length?'Rebuild index':'Generate index','indexBook',false],['Make searchable PDF','searchable',false]];
 for(const [label,action,force] of actions){const b=ui.button(label,()=>job(action,d,force),card);b.disabled=busy;}
 ui.button('Explore subject topics',()=>{k094Put('neetpg.topicsSubject',d.subject||'');window.dispatchEvent(new CustomEvent('amc-topics-seed',{detail:{subject:d.subject||'',docId:d.id}}));},card);
 const del=ui.button('Delete book',async()=>{if(!confirm(`Delete ${d.name}, original stored PDF, extracted pages and its notes?`))return;await m.call('deleteDoc',d.id);await refresh();},card);del.disabled=busy;
 }}
 }
 k094Watch(ui,refresh);ui.run(refresh);return ui.cleanup;
}

export function mountSearch094(root,deps={}) {
 const ui=k094Shell(root,'Search','Lexical passage retrieval with optional AI medical synonyms — not an embedding engine. Source excerpts stay local unless sent to AI.',deps),m=ui.model;
 let docs=[],terms=[],result=null,visible=25,history=k094Store('amc.search094.history',[]),token=0,queryUsed='',subjectUsed='',saved=new Set();
 const query=k094Input('Medical query'),subject=k094Select('Subject',[['','All subjects']]),book=k094Select('Book',[['','All books']]),expand=k094Input('Use AI synonyms',false,'checkbox');
 ui.controls.append(query.wrap,subject.wrap,book.wrap,expand.wrap);const chips=k094El('div','','row k094-chips'),hist=k094El('div','','k094-history');ui.shell.insertBefore(chips,ui.body);ui.shell.insertBefore(hist,ui.body);
 function invalidate(){token++;result=null;ui.body.replaceChildren();}
 function scopeBooks(){const rows=[['','All books'],...docs.filter(d=>!subject.input.value||d.subject===subject.input.value).map(d=>[d.id,d.name])];book.input.replaceChildren(...rows.map(([v,t])=>{const e=k094El('option',t);e.value=v;return e;}));invalidate();}
 subject.input.onchange=scopeBooks;book.input.onchange=invalidate;
 query.input.oninput=()=>{terms=[];drawChips();invalidate();};
 query.input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ui.run(()=>search());}};
 function drawChips(){chips.replaceChildren();chips.append(k094El('span','Expanded terms (editable):','small'));terms.forEach((term,i)=>{const input=k094Input('Term',term);input.input.onchange=()=>{terms[i]=input.input.value.trim().slice(0,100);terms=[...new Set(terms.filter(Boolean))].slice(0,25);drawChips();};chips.append(input.wrap);ui.button('Remove '+term,()=>{terms.splice(i,1);drawChips();},chips);});ui.button('Add term',()=>{terms.push('');drawChips();chips.querySelectorAll('input')[terms.length-1]?.focus();},chips);}
 function drawHistory(){hist.replaceChildren();hist.append(k094El('h2','Recent lookups'));for(const h of history)ui.button(h.query+(h.subject?' · '+h.subject:''),()=>{query.input.value=h.query;subject.input.value=h.subject||'';scopeBooks();terms=h.terms||[];drawChips();return search(false);},hist);if(history.length)ui.button('Clear history',()=>{history=[];k094Put('amc.search094.history',history);drawHistory();},hist);}
 async function search(allowExpand=true){const q=query.input.value.trim();if(q.length<3)throw Error('Enter at least three characters.');const request=++token;const selectedSubject=subject.input.value,selectedBook=book.input.value;ui.say('Searching…');let expanded=terms.filter(Boolean);
 if(expand.input.checked&&allowExpand&&!expanded.length){if(!await m.call('sd')){ui.say('No AI provider; searching original query only.');}else{try{const t=await m.call('expandTerms',q);if(request!==token||!ui.alive())return;expanded=String(t).split(/\s+/).filter(Boolean).slice(0,25);terms=expanded;drawChips();}catch(e){ui.say('Synonym expansion failed: '+e.message+' · searching original terms.');}}}
 const found=await m.search(q,expanded,{subject:selectedSubject,bookId:selectedBook});if(request!==token||!ui.alive())return;queryUsed=q;subjectUsed=selectedSubject;result=found;visible=25;
 history=[{query:q,subject:selectedSubject,terms:expanded},...history.filter(h=>h.query!==q||h.subject!==selectedSubject)].slice(0,20);k094Put('amc.search094.history',history);drawHistory();render();ui.say(`Searched ${found.passages} passages in ${found.docs.length} books · ${found.hits.length} matches. Scores are lexical, not confidence.`);}
 ui.button('Search repository',()=>search());ui.button('Clear query',()=>{query.input.value='';terms=[];drawChips();invalidate();});
 function render(){ui.body.replaceChildren();if(!result)return;if(!result.hits.length)ui.body.append(k094El('p','Nothing matched. Try other terms, broaden scope or OCR unread pages.','empty'));for(const p of result.hits.slice(0,visible)){const d=docs.find(d=>d.id===p.docId),card=k094El('article','','card k094-hit');card.append(k094El('h2',`${d?.name||'Unknown book'} · p.${p.page}`),k094El('p',`${d?.subject||'Unsorted'} · lexical score ${p.score}${p.weak?' · Weak match: may not answer your question':''}`,'muted small'),k094El('p',p.text,'k094-excerpt'));ui.body.append(card);
 ui.button('Open exact source page',()=>m.open(p),card);const key=p.docId+':'+p.page+':'+p.text;const save=ui.button(saved.has(key)?'Highlight saved':'Save highlight',async()=>{await m.highlight(p,d);saved.add(key);render();},card);save.disabled=saved.has(key);
 ui.button('Ask AI',()=>m.ask(queryUsed,subjectUsed||d?.subject||''),card);ui.button('Generate 5 questions',()=>m.generate(queryUsed,subjectUsed||d?.subject||'',p),card);ui.button('Copy citation',async()=>{await navigator.clipboard.writeText(`${d?.name||'Book'}, p.${p.page}\n${p.text}`);ui.say('Citation copied.');},card);
 }if(result.hits.length>visible)ui.button(`Load ${Math.min(25,result.hits.length-visible)} more matches`,()=>{visible+=25;render();},ui.body);}
 ui.run(async()=>{docs=await m.call('docs');if(!ui.alive())return;for(const s of k094Subjects(docs)){const o=k094El('option',s);o.value=s;subject.input.append(o);}scopeBooks();if(m.bridge()?.listHighlights){const highlights=await m.call('listHighlights');saved=new Set(highlights.filter(h=>h.source?.docId).map(h=>h.source.docId+':'+h.source.page+':'+h.text));}drawChips();drawHistory();if(!docs.length)ui.say('No books yet. Import PDFs in Library.');});
 return ()=>{token++;ui.cleanup();};
}

export function mountTopics094(root,deps={}) {
 const ui=k094Shell(root,'Topics','One combined index per subject. Compare original source excerpts with citations; differences are not silently merged.',deps),m=ui.model;
 let docs=[],overrides=k094Store('neetpg.topicOverrides',[]),token=0;
 const subject=k094Select('Subject',[['','Select subject']]),query=k094Input('Find topic'),chapters=k094Input('Chapters only',false,'checkbox'),multi=k094Input('Only topics in 2+ distinct books',false,'checkbox');ui.controls.append(subject.wrap,query.wrap,chapters.wrap,multi.wrap);
 const compare=k094El('section','','k094-comparison');ui.shell.append(compare);
 function saveOverrides(next){overrides=next;k094Put('neetpg.topicOverrides',next);render();}
 function selected(){return docs.filter(d=>(d.subject||'')===subject.input.value);}
 subject.input.onchange=()=>{token++;compare.replaceChildren();render();};query.input.oninput=render;chapters.input.onchange=render;multi.input.onchange=render;
 ui.button('Index unindexed books',async()=>{const pending=selected().filter(d=>!d.index?.length);if(!pending.length)throw Error('No unindexed books in this subject.');if(!await m.call('sd'))throw Error('Configure an AI provider in Settings first.');if(!confirm(`Index ${pending.length} books using your AI provider? Each may need several requests.`))return;for(const d of pending)await m.call('indexBook',d.id,d.name);ui.say('Index jobs requested; not yet complete.');render();});
 ui.button('Re-index subject',async()=>{if(!await m.call('sd'))throw Error('Configure an AI provider in Settings first.');if(!confirm('Replace indexes for every book in this subject using AI?'))return;for(const d of selected())await m.call('indexBook',d.id,d.name);render();});
 ui.button('Reset topic overrides',()=>{if(confirm('Reset hidden, split and joined topic overrides? Original book indexes stay unchanged.'))saveOverrides([]);});ui.button('Refresh',refresh);
 async function refresh(){const next=await m.call('docs');if(!ui.alive())return;docs=next;const old=subject.input.value;subject.input.replaceChildren();for(const s of [...new Set(docs.map(d=>d.subject||''))].sort()){const o=k094El('option',s||'Unsorted');o.value=s;subject.input.append(o);}subject.input.value=[...subject.input.options].some(o=>o.value===old)?old:(subject.input.options[0]?.value||'');render();}
 async function comparison(t){const request=++token;compare.replaceChildren(k094El('h2','Source comparison: '+t.title),k094El('p','Original excerpts only. Check each source; no consensus is inferred.','muted'));for(const r of t.refs){const pages=await m.call('pages',r.docId);if(request!==token||!ui.alive())return;const p=pages.find(p=>p.page===r.page),d=docs.find(d=>d.id===r.docId),card=k094El('article','','card k094-source');card.append(k094El('h3',`${d?.name||'Book'} · p.${r.page}`),k094El('p',p?.text||'No readable text for this source page. Use OCR in Library.','k094-excerpt'));ui.button('Open source',()=>m.open(r),card);if(p?.text){ui.button('Ask about topic',()=>m.ask(t.title,subject.input.value),card);ui.button('Quiz from this excerpt',()=>m.generate(t.title,subject.input.value,{docId:r.docId,page:r.page,text:p.text}),card);}compare.append(card);}}
 function render(){if(!ui.alive())return;ui.body.replaceChildren();const books=selected(),indexed=books.filter(d=>d.index?.length);let topics;try{k094Check(ui,'mergeTopics');topics=m.bridge().mergeTopics(indexed.map(d=>({docId:d.id,entries:d.index})),overrides);}catch(e){ui.say(e.message);return;}
 const found=k094FilterTopics(topics,{query:query.input.value,chapters:chapters.input.checked,multi:multi.input.checked});ui.body.append(k094El('p',`${found.length} of ${topics.length} topics · ${indexed.length}/${books.length} books indexed`,'muted'));for(const d of books)k094Jobs(ui,ui.body,d.id);if(!found.length)ui.body.append(k094El('p','No matching topics. Adjust filters or index books in this subject.','empty'));
 for(const t of found){const card=k094El('article','','card k094-topic');card.append(k094El('h2',t.title),k094El('p',`${new Set(t.refs.map(r=>r.docId)).size} distinct books · ${t.level===1?'Chapter':'Topic'}`,'small muted'));for(const r of t.refs){const d=docs.find(d=>d.id===r.docId);ui.button(`${d?.name||'Book'} · p.${r.page}`,()=>m.open(r),card);}ui.button('Compare source excerpts',()=>comparison(t),card);ui.button('Ask AI about topic',()=>m.ask(t.title,subject.input.value),card);ui.button('Generate 5-question topic quiz',()=>m.generate(t.title,subject.input.value,{topic:t.title,refs:t.refs}),card);
 ui.button('Hide topic',()=>saveOverrides([...overrides,{action:'hide',keys:[t.key]}]),card);if(t.refs.length>1)ui.button('Split book entries',()=>saveOverrides([...overrides,{action:'split',keys:[t.key]}]),card);ui.body.append(card);
 }}
 k094Watch(ui,refresh);ui.run(async()=>{await refresh();const initial=k094Store('neetpg.topicsSubject',null);if(initial!==null&&docs.some(d=>d.subject===initial)){subject.input.value=initial;render();}});return ()=>{token++;ui.cleanup();};
}
