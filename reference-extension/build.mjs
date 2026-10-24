// Bundles src/*.js into one classic script (no imports) for the app: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const order = ['store', 'retrieval', 'rules', 'files', 'taxonomy', 'bank', 'bankview', 'theme', 'runner094', 'clinicalLogic094', 'analytics', 'chat', 'integration094', 'workspace', 'knowledge094', 'index'];
let out = '/* amc-ext: built from C:/ad/amc-ext/src. Do not edit; run node build.mjs */\n(() => {\n"use strict";\n';
for (const f of order) {
  const src = readFileSync(new URL(`./src/${f}.js`, import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace(/^export (async function|function|const|let)/gm, '$1');
  out += `// ---- ${f}.js\n${src}\n`;
}
const css = readFileSync(new URL('./src/style.css', import.meta.url), 'utf8');
const css2 = readFileSync(new URL('./src/clinical094.css', import.meta.url), 'utf8');
out += `const st = document.createElement('style'); st.id = 'amc-ext-css'; st.textContent = ${JSON.stringify(css)} + ${JSON.stringify(css2)}; (document.head ? document.head.append(st) : document.addEventListener('DOMContentLoaded', () => document.head.append(st)));\n`;
out += '})();\n';
const dest = process.argv[2] || 'C:/ad/amc-app/dist/assets/amc-ext.js';
writeFileSync(dest, out);
console.log('wrote', dest, out.length, 'bytes');
