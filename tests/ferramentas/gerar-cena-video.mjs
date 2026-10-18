// Gera um trecho de vídeo a partir de uma foto, usando a página pública do Wan 2.2 no Hugging Face.
// Uso: node gerar.mjs <foto.jpg> <saida.mp4> <duracao_s> "<texto da cena>"
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space';
const [,, foto, saida, dur, prompt] = process.argv;

const info = await (await fetch(BASE + '/gradio_api/info')).json();
const params = info.named_endpoints['/generate_video'].parameters;
const def = n => params.find(p => p.parameter_name === n).parameter_default;

// 1) envia a foto
const fd = new FormData();
fd.append('files', new Blob([fs.readFileSync(foto)], { type: 'image/jpeg' }), path.basename(foto));
const up = await (await fetch(BASE + '/gradio_api/upload', { method: 'POST', body: fd })).json();
const caminho = up[0];

// 2) pede a geração
const corpo = { data: [
  { path: caminho, orig_name: path.basename(foto), mime_type: 'image/jpeg', meta: { _type: 'gradio.FileData' } },
  prompt, def('steps'), def('negative_prompt'), Number(dur), def('guidance_scale'), def('guidance_scale_2'), 42, true
] };
const r = await fetch(BASE + '/gradio_api/call/generate_video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
const { event_id } = await r.json();
if (!event_id) { console.error('sem event_id', r.status); process.exit(1); }

// 3) acompanha até terminar
const sse = await (await fetch(BASE + '/gradio_api/call/generate_video/' + event_id)).text();
const linhas = sse.split('\n');
let evento = '', resultado = null, erro = null;
for (const l of linhas) {
  if (l.startsWith('event:')) evento = l.slice(6).trim();
  else if (l.startsWith('data:')) {
    const d = l.slice(5).trim();
    if (evento === 'complete') resultado = JSON.parse(d);
    if (evento === 'error') erro = d;
  }
}
if (!resultado) { console.error('ERRO:', erro || sse.slice(-500)); process.exit(2); }
const video = resultado[0];
const url = (video.video && (video.video.url || BASE + '/gradio_api/file=' + video.video.path)) || video.url || (BASE + '/gradio_api/file=' + video.path);
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.writeFileSync(saida, buf);
console.log('ok', saida, buf.length, 'bytes, seed', resultado[1]);
