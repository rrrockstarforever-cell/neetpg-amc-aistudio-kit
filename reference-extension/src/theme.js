export function resolveTheme(choice, systemDark) {
  return choice === 'dark' ? 'dark' : choice === 'light' ? 'light' : systemDark ? 'dark' : 'light';
}
export function initTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const read = () => { try { return localStorage.getItem('amc.theme') || 'system'; } catch { return 'system'; } };
  function apply() { const c=read(); document.documentElement.dataset.theme=resolveTheme(c,mq.matches); document.documentElement.style.colorScheme=resolveTheme(c,mq.matches); }
  apply(); mq.addEventListener('change',apply);
  function attach() {
    const sidebar=document.querySelector('.sidebar'); if(!sidebar || sidebar.querySelector('.theme-control'))return;
    const box=document.createElement('label');box.className='theme-control';box.textContent='Appearance';
    const sel=document.createElement('select');sel.setAttribute('aria-label','Appearance');
    for(const [value,label] of [['light','Light'],['dark','Dark'],['system','System']]) {const o=document.createElement('option');o.value=value;o.textContent=label;sel.append(o);}
    sel.value=read();sel.onchange=()=>{localStorage.setItem('amc.theme',sel.value);apply();};box.append(sel);
    sidebar.insertBefore(box,sidebar.querySelector('.sidebar-soon'));
  }
  const start=()=>{attach();new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});};
  document.body?start():document.addEventListener('DOMContentLoaded',start,{once:true});
}

