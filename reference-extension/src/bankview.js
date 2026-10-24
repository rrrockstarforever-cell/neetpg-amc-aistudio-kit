import { bankInfo, browseBank } from './bank.js';

export const bkEsc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountBank(el){
 let st={q:'',filter:'all',page:0},alive=true;el.classList.add('an-page');
 async function draw(){
  const info=await bankInfo('emedici');if(!alive)return;
  if(!info){el.innerHTML='<header class="page-head"><h1>eMedici question bank</h1></header><p class="muted">The bank is loading for the first time…</p>';setTimeout(()=>alive&&draw(),1200);return;}
  const r=await browseBank('emedici',{q:st.q,onlyReview:st.filter==='review',imageOnly:st.filter==='image',page:st.page});if(!alive)return;
  const pages=Math.max(1,Math.ceil(r.total/15)),m=info.metadata||{};
  el.innerHTML=`<header class="page-head"><div><h1>eMedici question bank</h1><p class="muted">${info.count} distinct questions · ${m.playable??'?'} ready for scored practice · ${info.images} with clinical images · ${m.needsReview??0} flagged for checking. Answers are read from the source PDF by OCR and are not clinically verified.</p></div></header>
  <div class="bank-toolbar"><input id="bq" placeholder="Search question text or topic" value="${bkEsc(st.q)}"><button class="btn ${st.filter==='all'?'primary':''}" data-f="all">All</button><button class="btn ${st.filter==='image'?'primary':''}" data-f="image">With image</button><button class="btn ${st.filter==='review'?'primary':''}" data-f="review">Needs checking</button></div>
  <p class="muted small">${r.total} matching. Practise from this bank in Practice → AMC → eMedici question bank.</p><div id="bl"></div>
  <div class="bank-pagination"><button class="btn" id="bp" ${st.page<=0?'disabled':''}>← Previous</button><span class="muted">Page ${st.page+1} of ${pages}</span><button class="btn" id="bn" ${st.page+1>=pages?'disabled':''}>Next →</button></div>`;
  const list=el.querySelector('#bl');
  for(const q of r.items){const c=document.createElement('details');c.className='bank-card';
   c.innerHTML=`<summary>${q.needsReview?'<span class="an-badge">Check</span>':''}${q.image?'<span class="an-badge">Image</span>':''}<b>${bkEsc(q.group)}</b> · ${bkEsc(q.topic)} · <span class="muted">page ${q.sourcePage}</span><div>${bkEsc(q.question)}</div></summary><div class="an-question-body"></div>`;
   const body=c.querySelector('.an-question-body');
   if(q.image){const i=document.createElement('img');i.className='clinical-image';i.src=q.image;i.alt=q.imageAlt||'Clinical image';body.append(i);}
   body.insertAdjacentHTML('beforeend',`${(q.reviewIssues||[]).map(x=>`<div class="bank-warn">${bkEsc(x)}</div>`).join('')}<ol type="A">${q.options.map((o,k)=>`<li class="${k===q.answerIndex?'an-correct':''}">${bkEsc(o)} ${k===q.answerIndex?'✓':''}</li>`).join('')}</ol><p class="selectable">${bkEsc(q.explanation||'No explanation extracted.')}</p>`);list.append(c);}
  el.querySelectorAll('[data-f]').forEach(x=>x.onclick=()=>{st.filter=x.dataset.f;st.page=0;draw();});
  el.querySelector('#bq').onchange=e=>{st.q=e.target.value;st.page=0;draw();};
  el.querySelector('#bp').onclick=()=>{st.page--;draw();};el.querySelector('#bn').onclick=()=>{st.page++;draw();};
 }
 await draw();return()=>{alive=false;};
}

