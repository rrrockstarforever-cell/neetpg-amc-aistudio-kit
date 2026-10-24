import test from 'node:test';
import assert from 'node:assert/strict';
import {cfValidateGenerated094,cfPreset094} from '../src/clinicalLogic094.js';
test('generated sets reject malformed answer keys and retain actual usable count',()=>{
 const q={question:'Which diagnosis fits this patient?',options:['a','b','c','d'],answerIndex:2};
 assert.equal(cfValidateGenerated094([q,{...q,answerIndex:5}], 'neet').length,1);
 assert.equal(cfValidateGenerated094([q], 'amc').length,0);
});
test('presets never import live modules, keys or arbitrary fields',()=>{
 const p=cfPreset094({exam:'ini',n:200,src:'notes',qs:[1],apiKey:'secret',mode:'exam',subs:['Medicine']});
 assert.equal(p.n,100);assert.equal(p.exam,'ini');assert.equal(p.apiKey,undefined);assert.equal(p.qs,undefined);
});
