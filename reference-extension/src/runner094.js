// Timestamp-derived runner state, migration preserves question order and answers.
export function cfRunnerInit(m,now=Date.now()){
 const n=m.qs?.length||0;
 return {...m,runnerVersion:1,startedAt:m.startedAt??now,durationMs:m.durationMs??Math.max(1,n)*60000,pausedMs:m.pausedMs||0,pausedAt:m.pausedAt??null,currentIndex:Math.max(0,Math.min(n-1,m.currentIndex||0)),enteredAt:m.enteredAt??now,timeByQuestion:m.timeByQuestion||{},visited:m.visited||{0:true},flags:m.flags||{},answers:m.answers||{}};
}
export function cfRunnerElapsed(m,now=Date.now()){return Math.max(0,(m.finishedAt??m.pausedAt??now)-(m.startedAt??now)-(m.pausedMs||0));}
export function cfRunnerRemaining(m,now=Date.now()){return Math.max(0,m.durationMs-cfRunnerElapsed(m,now));}
export function cfRunnerPause(m,now=Date.now()){
 if(m.submitted)return m;
 if(m.pausedAt!=null)return {...m,pausedMs:(m.pausedMs||0)+now-m.pausedAt,pausedAt:null,enteredAt:now};
 return {...m,pausedAt:now,timeByQuestion:{...m.timeByQuestion,[m.currentIndex]:(m.timeByQuestion[m.currentIndex]||0)+Math.max(0,now-m.enteredAt)}};
}
export function cfRunnerJump(m,i,now=Date.now()){
 i=Math.max(0,Math.min(m.qs.length-1,i));if(m.pausedAt!=null)return m;
 return {...m,currentIndex:i,enteredAt:now,visited:{...m.visited,[i]:true},timeByQuestion:{...m.timeByQuestion,[m.currentIndex]:(m.timeByQuestion[m.currentIndex]||0)+(m.submitted?0:Math.max(0,now-m.enteredAt))}};
}
export function cfRunnerPick(m,i,c){
 if(m.pausedAt!=null||m.submitted)return m;
 if(!Number.isInteger(c)||c<0||c>=(m.qs[i]?.options?.length||0))throw Error('Invalid option');
 return {...m,answers:{...m.answers,[i]:c}};
}
export function cfRunnerFlag(m,i){return {...m,flags:{...m.flags,[i]:!m.flags[i]}};}
export function cfRunnerLabel(ms){let s=Math.floor(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
