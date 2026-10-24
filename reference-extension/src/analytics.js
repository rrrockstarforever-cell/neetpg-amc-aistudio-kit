import { LS, putAtt, getAtt } from './store.js';


// ---- progress groups: NEET PG + INI-CET together, AMC on its own (untagged old attempts count as AMC)
export function progTab() { return LS.get('amc.prog.tab', (() => { try { return JSON.parse(localStorage.getItem('amc.cm.cfg') || '{}').exam; } catch { return null; } })() || (window.__amcBridge && window.__amcBridge.exam() ? 'amc' : 'neet')); }
export function inTab(r) { return (r.exam || 'amc') === progTab(); }
export function tabsHtml() {
  const t = progTab();
  return `<div class="an-tabs">${[['neet', 'NEET PG'], ['ini', 'INI-CET'], ['amc', 'AMC']].map(([k, l]) => `<button class="btn small ${t === k ? 'primary' : ''}" data-ptab="${k}">${l}</button>`).join('')}<span class="muted small">Each exam is tracked on its own; nothing is added across exams.</span></div>`;
}
export function bindTabs(el) {
  const handler=ev => {
    const a = ev.target.closest('[data-ptab]');
    if (a) { LS.set('amc.prog.tab', a.dataset.ptab); window.dispatchEvent(new Event('amc-attempts')); }
  };el.addEventListener('click',handler);return()=>el.removeEventListener('click',handler);
}
export function difficultyName(d){return ({easy:'Easy',standard:'Standard',medium:'Normal',normal:'Normal',hard:'Hard',very_hard:'Very hard','very hard':'Very hard'})[String(d||'').toLowerCase()]||'Unrated';}
export function questionKey(q){return q.id||q.questionId||String(q.question||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
export function moduleRows(mod){return mod.qs.map((q,i)=>({...q,questionId:questionKey(q),subject:q.subject||q.group||'Unassigned',system:q.topic||q.system||'General',difficulty:q.difficulty||q.tier||'unknown',choice:mod.answers[i]??null,skipped:mod.answers[i]==null,correct:mod.answers[i]!=null&&mod.answers[i]===q.answerIndex,ts:mod.finishedAt||Date.now(),moduleId:mod.id,exam:mod.exam}));}
export function countRows(rows){const total=rows.length,skipped=rows.filter(r=>r.skipped||r.choice===null).length,correct=rows.filter(r=>r.correct&&!r.skipped).length,attempted=total-skipped;return {total,correct,skipped,wrong:attempted-correct,attempted,accuracy:attempted?Math.round(correct/attempted*100):null,scorePercent:total?Math.round(correct/total*100):null};}
export function summarizeRows(rows){
 const by=fn=>{const m=new Map();for(const r of rows){const name=fn(r);if(!m.has(name))m.set(name,[]);m.get(name).push(r);}return [...m].map(([name,x])=>({name,...countRows(x)}));};
 return {...countRows(rows),bySubject:by(r=>r.subject||r.group||'Unassigned'),byTopic:by(r=>r.system||r.topic||'General'),byDifficulty:by(r=>difficultyName(r.difficulty||r.tier)),bySource:by(r=>r.source||r.docName||r.doc||'Other')};
}
export function latestRows(rows){const m=new Map();for(const r of rows){const key=questionKey(r);if(key&&(!m.has(key)||(m.get(key).ts||0)<=(r.ts||0)))m.set(key,r);}return [...m.values()];}
export let analyticsQueue=Promise.resolve();
export function recordAttempt(q,ch,extra={}){
 const row={...q,...extra,exam:extra.exam||q.exam||window.__amcExamNow?.()||'amc',questionId:questionKey(q),subject:q.subject||q.group||'Unassigned',system:q.system||q.topic||'General',difficulty:q.difficulty||q.tier||'unknown',doc:q.docName||'',choice:ch??null,skipped:ch==null,correct:ch!=null&&ch===q.answerIndex,ts:Date.now()};
 // Small compatibility cache for revision-note generation; source images stay in IndexedDB.
 try{const a=LS.get('amc.attempts',[]);const {image,...compact}=row;a.push(compact);LS.set('amc.attempts',a.slice(-1200));}catch(e){console.warn('Practice cache storage:',e.message);}
 analyticsQueue=analyticsQueue.catch(()=>{}).then(async()=>{const b=await getAtt('analytics:attempts')||{id:'analytics:attempts',rows:[]};b.rows.push(row);await putAtt(b);window.dispatchEvent(new Event('amc-attempts'));});return analyticsQueue;
}
export function recordModule(mod){
 return analyticsQueue=analyticsQueue.catch(()=>{}).then(async()=>{if(await getAtt('analytics:module:'+mod.id))return;const rows=moduleRows(mod);await putAtt({id:'analytics:module:'+mod.id,mod,rows});
 const b=await getAtt('analytics:attempts')||{id:'analytics:attempts',rows:[]};
 for(const r of rows)if(!b.rows.some(x=>x.moduleId===mod.id&&x.questionId===r.questionId))b.rows.push(r);
 await putAtt(b);try{const L=LS.get('amc.attempts',[]);for(const r of rows)if(!r.skipped){const {image,...c}=r;L.push(c);}LS.set('amc.attempts',L.slice(-1200));}catch{}const summaries=LS.get('amc.module.summaries',[]);summaries.push({id:mod.id,title:mod.title,exam:mod.exam||'amc',ts:Date.now(),...summarizeRows(rows)});LS.set('amc.module.summaries',summaries.slice(-250));window.dispatchEvent(new Event('amc-attempts'));});
}
export async function allRows(){await analyticsQueue;const b=await getAtt('analytics:attempts');const legacy=LS.get('amc.attempts',[]);if(!b)return legacy.filter(r=>!r.moduleId);const keys=new Set(b.rows.map(r=>String(r.ts)+':'+questionKey(r)));return [...legacy.filter(r=>!r.moduleId&&!keys.has(String(r.ts)+':'+questionKey(r))),...b.rows];}
export const ae=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function statsHtml(a){return `<div class="an-stats">${[['Total',a.total],['Correct',a.correct],['Wrong',a.wrong],['Skipped',a.skipped],['Accuracy',a.accuracy==null?'—':a.accuracy+'%']].map(([k,v])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('')}</div>`;}
export function tableHtml(title,rs){return `<section class="an-table"><h3>${ae(title)}</h3><table><thead><tr><th>Category</th><th>Right</th><th>Wrong</th><th>Skipped</th><th>Accuracy*</th></tr></thead><tbody>${rs.map(r=>`<tr><td>${ae(r.name)}</td><td>${r.correct}</td><td>${r.wrong}</td><td>${r.skipped}</td><td>${r.accuracy==null?'—':r.accuracy+'%'}</td></tr>`).join('')}</tbody></table></section>`;}
export function summaryHtml(mod){const a=summarizeRows(moduleRows(mod));return `<div class="an-summary"><h2>Module analysis</h2>${statsHtml(a)}<p class="muted small">*Accuracy = correct ÷ attempted. Skips are shown separately. Difficulty is estimated unless measured.</p>${tableHtml('By subject',a.bySubject)}${tableHtml('By topic',a.byTopic)}${tableHtml('By difficulty',a.byDifficulty)}<p class="muted">Wrong and skipped questions are available in Review → subject → topic.</p></div>`;}
export function cfReviewKey(q){return JSON.stringify([q.exam||'amc',String(questionKey(q))]);}
export function cfReviewFilter(rows,opts={},metadata={}){
 const latest=new Map(),counts=new Map();
 for(const r of rows.filter(r=>(r.exam||'amc')===(opts.exam||'amc'))){const k=cfReviewKey(r);counts.set(k,(counts.get(k)||0)+(!r.correct&&!r.skipped&&r.choice!==null?1:0));if(!latest.has(k)||(latest.get(k).ts||0)<=(r.ts||0))latest.set(k,r);}
 const query=String(opts.query||'').trim().toLowerCase();
 return [...latest].map(([k,r])=>({...r,reviewMeta:metadata[k]||{},errors:counts.get(k)})).filter(r=>{
 const m=r.reviewMeta;return (!opts.subject||(r.subject||r.group||'Unassigned')===opts.subject)&&(!opts.topic||(r.system||r.topic||'General')===opts.topic)&&(!opts.trap||m.trap===opts.trap)&&(!opts.flagged||m.flagged)&&(!opts.unresolved||!m.mastered)&&(!query||[r.question,r.id,r.questionId,r.subject,r.explanation,JSON.stringify(r.sources||r.citations||[]),...(r.options||[]),m.trap].join(' ').toLowerCase().includes(query))&&(!opts.result||opts.result==='all'||opts.result==='skipped'&&(r.skipped||r.choice===null)||opts.result==='correct'&&r.correct||opts.result==='wrong'&&!r.correct&&!r.skipped&&r.choice!==null);
 }).sort((a,b)=>(opts.sort==='errors'?b.errors-a.errors:0)||(b.ts||0)-(a.ts||0)||cfReviewKey(a).localeCompare(cfReviewKey(b)));
}
export async function mountReview(el){
 const unbind=bindTabs(el);let sub=null,topic=null,filter='wrong',alive=true,rows=[],query='',subject='',trap='',flagged=false,sort='newest',exam=progTab();el.classList.add('an-page');
 const draw=()=>{
 if(!alive)return;const selected=cfReviewFilter(rows,{exam:progTab(),query,subject:sub||subject,topic,trap,flagged,sort},cfReviewReadMeta());
 el.innerHTML=`<header class="page-head"><div><h1>Review</h1><p class="muted">Subjects → topics → questions. Revisit mistakes without a one-question carousel.</p></div></header>${tabsHtml()}<div class="an-breadcrumb"><button class="btn small" data-back="all">All subjects</button>${sub?`<button class="btn small" data-back="subject">${ae(sub)}</button>`:''}${topic?`<span>${ae(topic)}</span>`:''}</div>${statsHtml(summarizeRows(selected))}`;
 el.insertAdjacentHTML('beforeend',`<section class="an-filters row" style="flex-wrap:wrap;gap:8px"><label>Search <input data-review-query value="${ae(query)}" placeholder="Stem, ID, citation or trap"></label><label>Subject <select data-review-subject><option value="">All subjects</option>${[...new Set(rows.map(r=>r.subject||r.group||'Unassigned'))].sort().map(n=>`<option ${subject===n?'selected':''}>${ae(n)}</option>`).join('')}</select></label><label>Trap <select data-review-trap><option value="">All user-assigned traps</option>${cfReviewTraps.map(n=>`<option ${trap===n?'selected':''}>${ae(n)}</option>`).join('')}</select></label><label><input type="checkbox" data-review-flagged ${flagged?'checked':''}> Flagged only</label><label>Sort <select data-review-sort><option value="newest">Newest</option><option value="errors" ${sort==='errors'?'selected':''}>Error frequency (count)</option></select></label><button class="btn" data-review-tsv>Export Anki TSV</button><button class="btn" data-review-json>Export JSON (includes private notes)</button><button class="btn" data-review-sprint>Start up to 15-MCQ sprint</button><button class="btn" data-review-due>Review SRS stack</button><span role="status" data-review-status></span></section>`);
 const status=msg=>{el.querySelector('[data-review-status]').textContent=msg;};
 const wire=(selector,event,fn)=>el.querySelector(selector).addEventListener(event,fn);
 wire('[data-review-query]','change',ev=>{query=ev.target.value;draw();});
 wire('[data-review-subject]','change',ev=>{subject=ev.target.value;sub=null;topic=null;draw();});wire('[data-review-trap]','change',ev=>{trap=ev.target.value;draw();});wire('[data-review-flagged]','change',ev=>{flagged=ev.target.checked;draw();});wire('[data-review-sort]','change',ev=>{sort=ev.target.value;draw();});
 const scope=()=>cfReviewFilter(rows,{exam:progTab(),query,subject:sub||subject,topic,trap,flagged,sort,result:filter},cfReviewReadMeta());
 wire('[data-review-tsv]','click',()=>{try{cfReviewDownload(cfReviewTsv(scope()),'Mistakes-'+progTab()+'.tsv','text/tab-separated-values;charset=utf-8');}catch(e){status(e.message);}});
 wire('[data-review-json]','click',()=>{try{cfReviewDownload(cfReviewJson(scope(),progTab()),'Mistakes-'+progTab()+'.json','application/json');}catch(e){status(e.message);}});
 wire('[data-review-due]','click',()=>window.dispatchEvent(new CustomEvent('amc-go',{detail:{view:'srs'}})));
 wire('[data-review-sprint]','click',()=>{const qs=cfReviewDrill(selected,progTab(),sub||subject||undefined,15);status(qs.length?'Launching '+qs.length+' stored questions.':'No unresolved questions in scope.');});
 if(!sub||!topic){const by=new Map();for(const r of selected){const k=!sub?(r.subject||r.group||'Unassigned'):(r.system||r.topic||'General');if(!by.has(k))by.set(k,[]);by.get(k).push(r);}
 const grid=document.createElement('div');grid.className='an-grid';for(const [name,items] of [...by].sort((a,b)=>a[0].localeCompare(b[0]))){const a=summarizeRows(items),b=document.createElement('button');b.className='an-folder';b.innerHTML=`<strong>${ae(name)}</strong><span>${a.correct} right · ${a.wrong} wrong · ${a.skipped} skipped</span><span class="muted small">${a.accuracy==null?'Not attempted':a.accuracy+'% accuracy'} · ${items.length} questions</span>`;b.onclick=()=>{if(!sub)sub=name;else topic=name;draw();};grid.append(b);}el.append(grid);if(!by.size)el.insertAdjacentHTML('beforeend','<p class="muted">Complete a Practice module to build your review map.</p>');
 }else{
 el.insertAdjacentHTML('beforeend',`<div class="row an-filters">${[['wrong','Wrong'],['skipped','Skipped'],['correct','Correct'],['all','All']].map(([k,n])=>`<button class="btn ${filter===k?'primary':''}" data-filter="${k}">${n}</button>`).join('')}</div>`);
 const list=selected.filter(r=>filter==='all'||filter==='skipped'&&(r.skipped||r.choice===null)||filter==='correct'&&r.correct||filter==='wrong'&&!r.correct&&!r.skipped&&r.choice!==null);
 for(const r of list){const q=document.createElement('details');q.className='an-question';q.innerHTML=`<summary><span class="an-badge">${ae(difficultyName(r.difficulty||r.tier))}</span> ${ae(r.question)}</summary><div class="an-question-body"></div>`;const body=q.querySelector('div');
 if(r.image&&/^data:image\/(jpeg|png|webp);base64,|^\.\/assets\/emedici\//.test(r.image)){const im=document.createElement('img');im.src=r.image;im.alt='Clinical source image';im.className='clinical-image';body.append(im);}
 body.insertAdjacentHTML('beforeend',`<ol type="A">${(r.options||[]).map((o,i)=>`<li class="${i===r.answerIndex?'an-correct':i===r.choice?'an-wrong':''}">${ae(o)} ${i===r.answerIndex?'✓':i===r.choice?'✕':''}</li>`).join('')}</ol><p class="muted small">${r.choice==null?'Skipped':'Your answer: '+String.fromCharCode(65+r.choice)} · ${ae(r.source||r.doc||'Practice')}${r.sourcePage?' · Source page '+r.sourcePage:''}</p><p class="selectable">${ae(r.explanation||'No saved explanation.')}</p>`);
 const tools=document.createElement('section');const meta=r.reviewMeta||{};tools.innerHTML=`<p class="muted small">${r.errors} recorded errors · ${meta.mastered?'Mastered (history retained)':'Unresolved'}</p><label>Private note (saved on change)<textarea data-review-notes>${ae(meta.notes||'')}</textarea></label><label>User-assigned trap <select data-review-trap-edit><option value="">Unassigned</option>${cfReviewTraps.map(n=>`<option ${meta.trap===n?'selected':''}>${ae(n)}</option>`).join('')}</select></label><div class="row"><button class="btn" data-review-flag>${meta.flagged?'Remove flag':'Flag for review'}</button><button class="btn" data-review-mastered>${meta.mastered?'Mark unresolved':'Keep in Mastered Bank'}</button><button class="btn" data-review-srs>Add to SRS</button><button class="btn" data-review-drill>Launch up to 5-Q re-drill</button></div><p role="status" data-card-status></p>`;
 const cardStatus=msg=>{tools.querySelector('[data-card-status]').textContent=msg;};
 const save=(patch,redraw=false)=>{try{cfReviewSaveMeta(r,patch);cardStatus('Saved locally.');if(redraw)draw();}catch(e){cardStatus('Could not save: '+e.message);}};
 tools.querySelector('[data-review-notes]').onchange=ev=>save({notes:ev.target.value});tools.querySelector('[data-review-trap-edit]').onchange=ev=>save({trap:ev.target.value});
 tools.querySelector('[data-review-flag]').onclick=()=>save({flagged:!meta.flagged},true);tools.querySelector('[data-review-mastered]').onclick=()=>save({mastered:!meta.mastered},true);
 const srs=tools.querySelector('[data-review-srs]');srs.disabled=!window.__amcBridge?.addMcqCard;srs.title=srs.disabled?'SRS bridge unavailable':'';srs.onclick=async()=>{srs.disabled=true;try{await cfReviewAddSrs(r);}catch(e){cardStatus(e.message);}finally{srs.disabled=false;}};
 tools.querySelector('[data-review-drill]').onclick=()=>{const qs=cfReviewDrill(rows,progTab(),r.subject||r.group||'Unassigned',5);cardStatus(qs.length?'Launching '+qs.length+' stored questions.':'No unresolved questions in this subject.');};body.append(tools);
 if((r.options||[]).length&&r.answerIndex!=null){const box=document.createElement('div');box.className='an-ai';
  const tog=document.createElement('button');tog.className='btn small';tog.textContent='🤖 Ask AI';
  const panel=document.createElement('div');panel.className='an-ai-panel';panel.hidden=true;
  const runAI=async(kind,scope,depth,extra)=>{const out=panel.querySelector('.an-ai-out');out.innerHTML='<p class="muted small">Thinking… this can take a minute.</p>';
   panel.querySelectorAll('button,select,input').forEach(x=>x.disabled=true);
   try{const X=window.__amcExt;const res=kind==='explain'?await X.explainQ(r):kind==='notes'?await X.notesQ(r,{scope,depth}):await X.askQ(r,extra);
    out.innerHTML=(res&&res.html)||md(res&&res.msg||'Done.');
    if(res&&res.src&&res.src.length){const srcs=res.src.map(s=>(s.book||'')+(s.page?' p.'+s.page:'')).filter(Boolean).slice(0,5).join(' · ');out.insertAdjacentHTML('beforeend',`<p class="muted small">Used excerpts: ${ae(srcs)}</p>`)}
   }catch(e2){out.innerHTML=`<p class="muted small">Ask AI failed: ${ae(e2.message||e2)}</p>`}
   panel.querySelectorAll('button,select,input').forEach(x=>x.disabled=false)};
  tog.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden&&!panel.dataset.built){panel.dataset.built='1';
   panel.innerHTML=`<div class="row" style="flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px"></div><div class="an-ai-out reading"></div>`;
   const bar=panel.querySelector('div');
   const mk=(label,fn)=>{const x=document.createElement('button');x.className='btn small';x.textContent=label;x.onclick=fn;return x};
   const depthSel=document.createElement('select');for(const d of['brief','standard','detailed']){const o=document.createElement('option');o.value=d;o.textContent=d;depthSel.append(o)}depthSel.value='standard';
   bar.append(mk('🔍 Explain every option',()=>runAI('explain')),mk('📝 Notes: this question',()=>runAI('notes','question',depthSel.value)),mk('📚 Notes: whole topic',()=>runAI('notes','topic',depthSel.value)),depthSel);
   const inp=document.createElement('input');inp.placeholder='Ask anything about this question…';inp.style.flex='1';inp.style.minWidth='220px';
   const ask=mk('Ask',()=>{if(inp.value.trim())runAI('ask',null,depthSel.value,inp.value.trim())});
   inp.addEventListener('keydown',ev=>{if(ev.key==='Enter')ask.click()});
   bar.append(inp,ask);}};
  box.append(tog,panel);body.append(box);}el.append(q);}
 if(!list.length)el.insertAdjacentHTML('beforeend','<p class="muted">No questions in this filter.</p>');
 }
 el.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{if(b.dataset.back==='all'){sub=null;topic=null;}else topic=null;draw();});el.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;draw();});};
 const refresh=async()=>{if(exam!==progTab()){exam=progTab();sub=null;topic=null;subject='';}rows=(await allRows()).filter(inTab);draw();};await refresh();window.addEventListener('amc-attempts',refresh);return()=>{alive=false;unbind?.();window.removeEventListener('amc-attempts',refresh);};
}
export async function mountProgress(el){
 const unbind=bindTabs(el);let alive=true,sort='accuracy';
 const draw=async()=>{const exam=progTab(),rows=(await allRows()).filter(r=>(r.exam||'amc')===exam);if(!alive||exam!==progTab())return;
 const a=summarizeRows(rows),hist=LS.get('amc.module.summaries',[]).filter(m=>(m.exam||'amc')===exam).slice(-8).reverse();
 const subjects=[...a.bySubject].sort((x,y)=>sort==='volume'?y.total-x.total:(x.accuracy??101)-(y.accuracy??101));
 el.classList.add('an-page');el.innerHTML=`<header class="page-head"><div><h1>Performance Analytics</h1><p class="muted">Historical attempts including repeats. Accuracy = correct ÷ attempted; skips excluded. National benchmarks, coverage and retention are unavailable.</p></div><button class="btn" data-progress-pdf ${window.native?.savePdf?'':'disabled'}>Export Report PDF</button></header>${tabsHtml()}${statsHtml(a)}<label>Sort subjects <select data-progress-sort><option value="accuracy">Lowest Accuracy</option><option value="volume" ${sort==='volume'?'selected':''}>Highest Volume</option></select></label><div class="an-two">${tableHtml('Subject accuracy',subjects)}${tableHtml('Difficulty accuracy (saved labels)',a.byDifficulty)}</div><section class="an-table"><h3>Subject remediation</h3>${subjects.map((r,i)=>`<div class="an-history"><strong>${ae(r.name)}</strong><span>${r.wrong} wrong · ${r.skipped} skipped</span><button class="btn" data-remediate="${i}">Remediate (up to 15 stored questions)</button></div>`).join('')||'<p>No attempts yet.</p>'}</section><section class="an-table"><h3>Recent completed modules</h3>${hist.map((m,i)=>`<div class="an-history"><strong>${ae(m.title)}</strong><span>${m.correct}/${m.total} correct · ${m.accuracy??'—'}% attempted accuracy</span><button class="btn" data-review-module="${i}">Review Answers</button></div>`).join('')||'<p class="muted">No completed modules yet.</p>'}</section><button class="btn" data-progress-review>Mistake Notebook</button><p role="status" data-progress-status></p>`;
 const status=t=>{el.querySelector('[data-progress-status]').textContent=t;};
 el.querySelector('[data-progress-sort]').onchange=e=>{sort=e.target.value;draw();};
 el.querySelector('[data-progress-pdf]').onclick=async()=>{try{const result=await cfReviewPdf(rows,exam);status(result===false?'PDF export cancelled.':'PDF export completed or save dialog handled.');}catch(e){status(e.message);}};
 el.querySelectorAll('[data-remediate]').forEach(b=>b.onclick=()=>{const qs=cfReviewDrill(rows,exam,subjects[Number(b.dataset.remediate)].name,15);status(qs.length?'Launching '+qs.length+' stored questions.':'No unresolved questions in this subject.');});
 el.querySelector('[data-progress-review]').onclick=()=>window.dispatchEvent(new CustomEvent('amc-go',{detail:{view:'review'}}));
 el.querySelectorAll('[data-review-module]').forEach(b=>b.onclick=async()=>{const mod=await getAtt('analytics:module:'+hist[Number(b.dataset.reviewModule)].id);if(!mod){status('Saved module unavailable.');return;}el.innerHTML=summaryHtml(mod.mod)+mod.rows.map(r=>`<details class="an-question"><summary>${ae(r.question)}</summary><ol type="A">${(r.options||[]).map((o,i)=>`<li>${ae(o)} ${i===r.answerIndex?'✓ Correct':i===r.choice?'✕ Chosen':''}</li>`).join('')}</ol><p>${ae(r.explanation||'No saved explanation.')}</p></details>`).join('')+'<button class="btn" data-progress-back>Back to Progress</button>';el.querySelector('[data-progress-back]').onclick=draw;});
 };await draw();window.addEventListener('amc-attempts',draw);return()=>{alive=false;unbind?.();window.removeEventListener('amc-attempts',draw);};
}
export const cfReviewTraps=['Conceptual Gap','50:50 Gamble','Negative Cue Misread','Image Distractor Ambiguity'];
export function cfReviewReadMeta(storage=typeof window==='undefined'?undefined:window.localStorage){try{return JSON.parse(storage.getItem('amc.review.metadata')||'{}')||{};}catch{return {};}}
export function cfReviewSaveMeta(q,patch,storage=window.localStorage){
 const all=cfReviewReadMeta(storage),key=cfReviewKey(q),next={...all[key]};
 for(const field of ['notes','trap','flagged','mastered'])if(Object.hasOwn(patch,field))next[field]=patch[field];
 next.updatedAt=Date.now();all[key]=next;storage.setItem('amc.review.metadata',JSON.stringify(all));return next;
}
export function cfReviewTsv(rows){
 const cell=t=>ae(t).replace(/\t/g,' ').replace(/\r?\n/g,'<br>');
 return '#separator:tab\n#html:true\n'+rows.map(r=>[cell(r.question)+'<br>'+ (r.options||[]).map((o,i)=>String.fromCharCode(65+i)+'. '+cell(o)).join('<br>'),cell(r.options?.[r.answerIndex]||'')+'<br>'+cell(r.explanation||'')+'<br>'+cell(r.source||r.doc||'')].join('\t')).join('\n');
}
export function cfReviewJson(rows,exam){return JSON.stringify({schema:'amc-review',version:1,exam,questions:rows},null,2);}
export function cfReviewDownload(text,name,type,env=window){const url=env.URL.createObjectURL(new env.Blob([text],{type})),a=env.document.createElement('a');a.href=url;a.download=name;env.document.body.append(a);try{a.click();}finally{a.remove();env.setTimeout(()=>env.URL.revokeObjectURL(url),1000);}}
export async function cfReviewAddSrs(q,env=window){if(!env.__amcBridge?.addMcqCard)throw new Error('SRS insertion unavailable.');await env.__amcBridge.addMcqCard(q,{exam:q.exam||'amc',subject:q.subject||q.group||'Unassigned',topic:q.topic||q.system||'General'});env.dispatchEvent(new env.CustomEvent('amc-go',{detail:{view:'srs'}}));}
export function cfReviewDrill(rows,exam,subject,limit=5,env=window){const qs=cfReviewFilter(rows,{exam,subject,unresolved:true,sort:'errors'},cfReviewReadMeta(env.localStorage||null)).filter(r=>!r.correct).slice(0,limit);if(qs.length)env.dispatchEvent(new env.CustomEvent('amc-drill',{detail:{exam,subject,qs}}));return qs;}
export async function cfReviewPdf(rows,exam,env=window){if(!env.native?.savePdf)throw new Error('PDF export unavailable.');const a=summarizeRows(rows.filter(r=>(r.exam||'amc')===exam));return env.native.savePdf('<html><body><h1>'+ae(({amc:'AMC',neet:'NEET PG',ini:'INI-CET'})[exam]||exam)+' Progress</h1>'+statsHtml(a)+'<p>Accuracy = correct / attempted; skips excluded. All attempts, including repeats. No national benchmark available.</p>'+tableHtml('Subjects',a.bySubject)+tableHtml('Difficulty',a.byDifficulty)+'</body></html>','Progress-'+exam+'.pdf');}
