// data/ フォルダの CSV を読み込む(書き方がまちがっていても止まらず、まちがいを知らせる)
export const DATA = { party: [], enemies: [], skills: [], items: [] };
export const dataErrors = [];
export const LOOKS = ['きのこ', 'どんぐり', 'はっぱ'];   // てきの「みため」に書けるもの(js/sprites.js にある絵)
export const ARMOR_LOOKS = ['ぬの', 'かわ', 'てつ'];     // よろいの「みため」
export const WEAPON_LOOKS = ['ぼう', 'けん'];            // ぶきの「みため」

const SPEC = {
  party: { file: 'data/party.csv', label: 'みかた',
    cols: { id: 'id', name: 'なまえ', lv: 'レベル', exp: 'けいけんち', hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ', learn: 'おぼえる わざ' },
    nums: ['lv', 'exp', 'hp', 'mp', 'atk', 'def', 'spd'], lists: ['learn'], optional: ['name', 'learn'] },
  enemies: { file: 'data/enemies.csv', label: 'てき',
    cols: { id: 'id', name: 'なまえ', look: 'みため', move: 'うごき', hp: 'HP', mp: 'MP', atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ', exp: 'けいけんち', skills: 'わざ' },
    nums: ['hp', 'mp', 'atk', 'def', 'spd', 'exp'], lists: ['skills'], optional: ['skills', 'move'],
    choices: { move: ['うろうろ', 'ゆっくり', 'はやい'] } },
  skills: { file: 'data/skills.csv', label: 'わざ・じゅもん',
    cols: { id: 'id', name: 'なまえ', type: 'ぶんるい', mp: 'MP', effect: 'こうか', target: 'あいて', pow: 'いりょく', desc: 'せつめい' },
    nums: ['mp', 'pow'], optional: ['desc'],
    choices: { type: ['わざ', 'じゅもん'], effect: ['こうげき', 'かいふく'], target: ['ひとり', 'ぜんぶ', 'じぶん'] } },
  items: { file: 'data/items.csv', label: 'どうぐ・そうび',
    cols: { id: 'id', name: 'なまえ', kind: 'しゅるい', val: 'こうか', look: 'みため', desc: 'せつめい' },
    nums: ['val'], optional: ['desc', 'look'], choices: { kind: ['かいふく', 'よろい', 'ぶき', 'だいじ'] } },
};

const norm = s => String(s ?? '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();   // 全角/半角・スペースの ちがいを なくす

// CSV の文字を表にする("" でかこまれた , や改行にも対応)
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error('not found');
  const buf = await res.arrayBuffer();
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch (_) { text = new TextDecoder('shift_jis').decode(buf); }   // Excel で保存した CSV
  return text.replace(/^﻿/, '');
}

function table(key, text) {
  const sp = SPEC[key], where = `${sp.label}(${sp.file})`;
  const rows = parseCSV(text);
  if (!rows.length) { dataErrors.push(`${where}が からっぽです。`); return []; }
  const head = rows[0].map(norm);
  const colIdx = {};
  for (const [k, name] of Object.entries(sp.cols)) {
    const i = head.indexOf(norm(name));
    if (i < 0) { if (!sp.optional?.includes(k)) dataErrors.push(`${where}の 1行目に「${name}」の列が ありません。`); }
    else colIdx[k] = i;
  }
  const out = [];
  rows.slice(1).forEach((r, n) => {
    const line = n + 2;
    if (r.every(c => !c.trim())) return;               // 空の行は とばす
    const o = {};
    for (const k of Object.keys(sp.cols)) {
      const raw = colIdx[k] !== undefined ? (r[colIdx[k]] ?? '').trim() : '';
      if (sp.nums.includes(k)) {
        const v = Number(raw.normalize('NFKC'));
        if (raw === '' || !Number.isFinite(v)) { dataErrors.push(`${where}の ${line}行目:「${sp.cols[k]}」が 数字ではありません(「${raw}」)。0にします。`); o[k] = 0; }
        else o[k] = v;
      } else if (sp.lists?.includes(k)) o[k] = raw.split(/[\s、,・]+/).filter(Boolean);
      else o[k] = raw;
      if (sp.choices?.[k] && !sp.choices[k].includes(o[k]) && !(o[k] === '' && sp.optional?.includes(k))) {
        dataErrors.push(`${where}の ${line}行目:「${sp.cols[k]}」は ${sp.choices[k].join(' / ')} のどれかにしてください(「${raw}」)。`);
        o[k] = sp.choices[k][0];
      }
    }
    if (!o.id) { dataErrors.push(`${where}の ${line}行目: id が空なので、この行は使いません。`); return; }
    out.push(o);
  });
  return out;
}

export const byId = (key, id) => DATA[key].find(o => o.id === id);

async function loadAll() {
  await Promise.all(Object.keys(SPEC).map(async key => {
    try { DATA[key] = table(key, await fetchText(SPEC[key].file)); }
    catch (_) { dataErrors.push(`${SPEC[key].label}(${SPEC[key].file})を 読み込めませんでした。ファイル名と場所を確かめてください。`); }
  }));
  // おたがいの つながりを 確かめる
  for (const p of DATA.party) for (const s of p.learn) if (!byId('skills', s)) dataErrors.push(`みかた(party.csv): 「${s}」という わざが skills.csv に ありません。`);
  for (const e of DATA.enemies) {
    for (const s of e.skills) if (!byId('skills', s)) dataErrors.push(`てき(enemies.csv)「${e.id}」: 「${s}」という わざが skills.csv に ありません。`);
    if (!LOOKS.includes(e.look)) { dataErrors.push(`てき(enemies.csv)「${e.id}」: みためは ${LOOKS.join(' / ')} のどれかにしてください。`); e.look = LOOKS[0]; }
  }
  for (const e of DATA.enemies) if (!e.move) e.move = 'うろうろ';
  for (const it of DATA.items) {
    const ok = it.kind === 'よろい' ? ARMOR_LOOKS : it.kind === 'ぶき' ? WEAPON_LOOKS : null;
    if (ok && it.look && !ok.includes(it.look)) { dataErrors.push(`どうぐ(items.csv)「${it.id}」: みためは ${ok.join(' / ')} のどれかにしてください。`); it.look = ''; }
  }
  if (!DATA.party.some(p => p.id === 'hero')) dataErrors.push('みかた(party.csv)に id が hero の行が ありません。');
}
export const ready = loadAll();
