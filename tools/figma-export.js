#!/usr/bin/env node
/**
 * Exporta o arquivo do Figma do VettiConfig.
 *
 * Saída: figma-export/figma-output/
 *   - figma-export.json      (estrutura completa do documento)
 *   - figma-images.json      (URLs PNG de cada tela 1920x1080)
 *
 * A pasta figma-export/ está no .gitignore — output não vai pro repo.
 *
 * Uso:
 *   FIGMA_TOKEN=figd_xxx node tools/figma-export.js
 *   node tools/figma-export.js --token figd_xxx --file-key HyTsSy8VWByMM2FF0JARtA
 *
 * Tokens: https://www.figma.com/developers/api#access-tokens
 * File key: parte da URL do Figma — figma.com/file/<KEY>/...
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── CLI args ────────────────────────────────────────────────
const args = (() => {
  const out = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === '-h' || a === '--help') { out.help = true; continue; }
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { out[k] = next; i++; }
      else                                 { out[k] = true; }
    }
  }
  return out;
})();

if (args.help) {
  console.log(`
Uso:
  FIGMA_TOKEN=<seu-token> node tools/figma-export.js [opções]

Opções:
  --token <token>      Token de acesso pessoal Figma (alternativa ao env var)
  --file-key <key>     File key do arquivo Figma (default: HyTsSy8VWByMM2FF0JARtA)
  --skip "Sec1,Sec2"   Seções a ignorar (default: "Dev.,Mod. Padrão,Page 2")
  --no-images          Não baixa as URLs de imagens (só estrutura JSON)
  --out <dir>          Diretório de saída (default: figma-export/figma-output)

Tokens: https://www.figma.com/developers/api#access-tokens
`);
  process.exit(0);
}

const TOKEN    = args.token    || process.env.FIGMA_TOKEN;
const FILE_KEY = args['file-key'] || 'HyTsSy8VWByMM2FF0JARtA';
const OUT_DIR  = args.out      || path.resolve(__dirname, '..', 'figma-export', 'figma-output');
const SKIP     = (args.skip || 'Dev.,Mod. Padrão,Page 2').split(',').map(s => s.trim()).filter(Boolean);
const NO_IMAGES = !!args['no-images'];

if (!TOKEN) {
  console.error('Erro: faltou o token. Use FIGMA_TOKEN env var ou --token.');
  console.error('Rode `node tools/figma-export.js --help` para detalhes.');
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── HTTP ────────────────────────────────────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'X-Figma-Token': TOKEN, 'User-Agent': 'VettiConfig-Extractor/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 300))); }
      });
    }).on('error', reject);
  });
}

// ─── Coleta de frames 1920x1080 ──────────────────────────────
function collectFrames(page) {
  const out = [];
  for (const node of page.children) {
    if (SKIP.some((s) => node.name && node.name.startsWith(s))) continue;
    const children = node.type === 'SECTION' ? (node.children || []) : [node];
    for (const child of children) {
      if (child.type !== 'FRAME') continue;
      const bb = child.absoluteBoundingBox || {};
      if (bb.width !== 1920 || bb.height !== 1080) continue;
      out.push({
        id:      child.id,
        name:    child.name,
        section: node.type === 'SECTION' ? node.name : '—'
      });
    }
  }
  return out;
}

// ─── Main ────────────────────────────────────────────────────
(async () => {
  console.log('📥 Baixando estrutura do arquivo Figma...');
  const file = await get(`https://api.figma.com/v1/files/${FILE_KEY}`);
  if (file.err || file.status === 403 || file.status === 404) {
    console.error('❌ Erro:', file.err || file.message || JSON.stringify(file));
    process.exit(1);
  }

  const jsonPath = path.join(OUT_DIR, 'figma-export.json');
  fs.writeFileSync(jsonPath, JSON.stringify(file));
  const sizeKb = (fs.statSync(jsonPath).size / 1024).toFixed(0);
  console.log(`✅ ${jsonPath} (${sizeKb} KB)`);

  if (NO_IMAGES) {
    console.log('ℹ️  --no-images informado, pulando download das URLs de imagens.');
    return;
  }

  let frames = [];
  for (const page of file.document.children) {
    if (page.type !== 'CANVAS') continue;
    frames = frames.concat(collectFrames(page));
  }
  console.log(`🖼  ${frames.length} telas 1920×1080 encontradas`);

  if (frames.length === 0) {
    console.warn('⚠️  Nenhum frame 1920×1080. Verifique --skip e file-key.');
    return;
  }

  const BATCH = 20;
  const images = {};
  for (let i = 0; i < frames.length; i += BATCH) {
    const ids = frames.slice(i, i + BATCH).map((f) => f.id).join(',');
    process.stdout.write(`   Lote ${Math.floor(i / BATCH) + 1}/${Math.ceil(frames.length / BATCH)}... `);
    const imgData = await get(
      `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=1`
    );
    if (imgData.err) console.log('⚠️  ' + imgData.err);
    else { Object.assign(images, imgData.images || {}); console.log('✅'); }
    if (i + BATCH < frames.length) await new Promise((r) => setTimeout(r, 500));
  }

  const imagesOut = frames.map((f) => ({
    id: f.id, name: f.name, section: f.section, url: images[f.id] || null
  }));
  const imgPath = path.join(OUT_DIR, 'figma-images.json');
  fs.writeFileSync(imgPath, JSON.stringify(imagesOut, null, 2));
  const ok = imagesOut.filter((f) => f.url).length;
  console.log(`✅ ${imgPath} (${ok}/${imagesOut.length} com URL)`);
  console.log('🎉 Pronto.');
})().catch((err) => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
