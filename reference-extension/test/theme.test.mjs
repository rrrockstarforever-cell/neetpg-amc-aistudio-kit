import test from 'node:test';import assert from 'node:assert/strict';
test('explicit Light overrides a dark system; System follows OS',async()=>{const m=await import('../src/theme.js');assert.equal(m.resolveTheme('light',true),'light');assert.equal(m.resolveTheme('system',true),'dark');assert.equal(m.resolveTheme('dark',false),'dark');assert.equal(m.resolveTheme('bad',false),'light');});
