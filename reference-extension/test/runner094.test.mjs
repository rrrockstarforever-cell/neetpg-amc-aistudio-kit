import test from 'node:test';
import assert from 'node:assert/strict';
import {cfRunnerInit,cfRunnerElapsed,cfRunnerPause,cfRunnerJump,cfRunnerPick,cfRunnerFlag,cfRunnerRemaining} from '../src/runner094.js';
test('runner survives resume with timestamps, pause time is excluded',()=>{
 let m=cfRunnerInit({id:1,exam:'neet',qs:[{},{}],answers:{}},1000);
 assert.equal(cfRunnerElapsed(m,5000),4000);
 m=cfRunnerPause(m,5000); assert.equal(cfRunnerElapsed(m,10000),4000);
 m=cfRunnerPause(m,12000);assert.equal(cfRunnerElapsed(m,15000),7000);
 assert.equal(cfRunnerRemaining(m,15000),m.durationMs-7000);
});
test('jump accounts dwell and preserves answer and flags through serialization',()=>{
 let m=cfRunnerInit({qs:[{options:['a','b']},{options:['c','d']}],answers:{}},1000);
 m=cfRunnerPick(m,0,1);m=cfRunnerFlag(m,0);m=cfRunnerJump(m,1,4000);
 assert.equal(m.timeByQuestion[0],3000);assert.equal(m.currentIndex,1);
 m=cfRunnerInit(JSON.parse(JSON.stringify(m)),5000);
 assert.equal(m.answers[0],1);assert.equal(m.flags[0],true);
 assert.equal(m.timeByQuestion[0],3000);
 assert.throws(()=>cfRunnerPick(m,1,3),/option/);
});
test('paused and submitted questions cannot be changed; bounds clamp',()=>{
 let m=cfRunnerInit({qs:[{options:['a','b']}],answers:{}},1000);
 m=cfRunnerPause(m,2000);assert.deepEqual(cfRunnerPick(m,0,0).answers,{});
 m=cfRunnerPause(m,3000);assert.equal(cfRunnerJump(m,99,4000).currentIndex,0);
 assert.deepEqual(cfRunnerPick({...m,submitted:true},0,1).answers,{});
});
