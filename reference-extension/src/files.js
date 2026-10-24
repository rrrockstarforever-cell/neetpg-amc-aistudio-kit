// Turn an uploaded file into page texts. PDFs use the app's PDF reader, with OCR for scanned pages.
export async function readDocx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw Error('Not a valid .docx file.');
  let p = dv.getUint32(eocd + 16, true); const n = dv.getUint16(eocd + 10, true);
  for (let k = 0; k < n; k++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.slice(p + 46, p + 46 + nl));
    if (name === 'word/document.xml') {
      const lnl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true), start = off + 30 + lnl + lxl;
      let data = buf.slice(start, start + csize);
      if (method === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      const xml = new TextDecoder().decode(data);
      const text = xml.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      const pages = []; const lines = text.split('\n'); let cur = '';
      for (const l of lines) { cur += l + '\n'; if (cur.length > 3000) { pages.push(cur.trim()); cur = ''; } }
      if (cur.trim()) pages.push(cur.trim());
      return pages;
    }
    p += 46 + nl + xl + cl;
  }
  throw Error('No text found in this .docx file.');
}
export async function readFile(file, B, prog = () => {}) {
  const name = file.name, ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf' || file.type === 'application/pdf') {
    prog('Reading ' + name + '…');
    const pages = await B.ju(file, (i, n) => prog(`Reading ${name}: page ${i}/${n}`));
    const empty = pages.map((t, i) => (t || '').replace(/\s/g, '').length < 40 ? i : -1).filter(i => i >= 0);
    if (empty.length) {
      const doc = await B.pdf({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const wk = await B.Hf(B.Gf().mode);
      try {
        for (let k = 0; k < empty.length; k++) {
          const i = empty[k]; prog(`OCR ${name}: page ${i + 1} (${k + 1}/${empty.length})`);
          const pg = await doc.getPage(i + 1); const cv = await B.render(pg);
          const { data } = await wk.recognize(cv); cv.width = cv.height = 0;
          pages[i] = data.text.replace(/[ \t]+/g, ' ').trim();
        }
      } finally { await wk.terminate().catch(() => {}); await doc.destroy?.(); }
    }
    return { kind: 'pdf', pages, ocr: empty.length };
  }
  if (file.type.startsWith('image/') || /^(png|jpe?g|webp|bmp|gif)$/.test(ext)) {
    prog('Reading image ' + name + ' with OCR…');
    return { kind: 'image', pages: [await B.vh(file, s => prog('OCR ' + name + ': ' + s))], ocr: 1 };
  }
  if (ext === 'docx') return { kind: 'docx', pages: await readDocx(file) };
  if (/^(txt|md|csv|json|html?|tsv|xml|rtf)$/.test(ext) || file.type.startsWith('text/')) {
    const t = await file.text(); const pages = [];
    for (let i = 0; i < t.length; i += 3000) pages.push(t.slice(i, i + 3000));
    return { kind: 'text', pages };
  }
  throw Error(`${name}: this file type is not supported yet. Use PDF, Word (.docx), an image, or a text file.`);
}

