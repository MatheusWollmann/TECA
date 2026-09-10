#!/usr/bin/env node
/**
 * Importa orações de data/prayers-bulk.json para o Supabase ou gera SQL.
 *
 * Uso:
 *   node scripts/import-prayers.mjs --validate
 *   node scripts/import-prayers.mjs --validate --input data/prayers-scraped-catolicoapp.json
 *   node scripts/import-prayers.mjs --emit-sql [--out supabase/seeds/prayers_bulk.sql]
 *   node scripts/import-prayers.mjs --insert   # precisa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Campos extra no JSON (ex.: source_url do scrape) são ignorados no insert/SQL.
 *
 * RLS: inserts pelo cliente anon falham sem policy; use service_role ou execute o SQL como postgres
 * no SQL Editor (ignora RLS).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_JSON = join(ROOT, 'data', 'prayers-bulk.json');

function resolveInputPath(argv) {
  const i = argv.indexOf('--input');
  if (i >= 0 && argv[i + 1]) {
    const p = argv[i + 1];
    return p.startsWith('/') ? p : join(ROOT, p);
  }
  const eq = argv.find((a) => a.startsWith('--input='));
  if (eq) {
    const p = eq.slice('--input='.length);
    return p.startsWith('/') ? p : join(ROOT, p);
  }
  return DEFAULT_JSON;
}

const ALLOWED_CATEGORIES = new Set([
  'Diárias',
  'Marianas',
  'Santos',
  'Momentos da Vida',
  'Intenção Especial',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sqlLiteral(value) {
  if (value == null) return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function sqlTextArray(tags) {
  if (!tags || tags.length === 0) return 'ARRAY[]::text[]';
  const inner = tags.map((t) => sqlLiteral(t)).join(', ');
  return `ARRAY[${inner}]`;
}

function loadPrayers(jsonPath) {
  const raw = readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const prayers = data.prayers;
  if (!Array.isArray(prayers)) throw new Error(`${jsonPath}: falta array "prayers"`);
  return { meta: data._meta || {}, prayers, jsonPath };
}

function validate(prayers) {
  const errors = [];
  prayers.forEach((p, i) => {
    const prefix = `prayers[${i}] "${p.title || '?'}":`;
    if (!p.title || typeof p.title !== 'string') errors.push(`${prefix} title obrigatório`);
    if (!p.text || typeof p.text !== 'string') errors.push(`${prefix} text obrigatório`);
    if (!p.category || typeof p.category !== 'string') errors.push(`${prefix} category obrigatório`);
    else if (!ALLOWED_CATEGORIES.has(p.category))
      errors.push(`${prefix} category inválida "${p.category}" (use uma de: ${[...ALLOWED_CATEGORIES].join(', ')})`);
    if (p.tags !== undefined && !Array.isArray(p.tags))
      errors.push(`${prefix} tags deve ser array de strings`);
    if (p.tags) {
      p.tags.forEach((t, j) => {
        if (typeof t !== 'string') errors.push(`${prefix} tags[${j}] deve ser string`);
      });
    }
    if (p.id !== undefined && typeof p.id !== 'string') errors.push(`${prefix} id deve ser string uuid opcional`);
    else if (p.id && !UUID_RE.test(p.id)) errors.push(`${prefix} id não é um UUID válido`);
    if (p.parent_prayer_id !== undefined && p.parent_prayer_id !== null && typeof p.parent_prayer_id !== 'string')
      errors.push(`${prefix} parent_prayer_id deve ser string uuid ou omitido`);
    else if (p.parent_prayer_id && !UUID_RE.test(p.parent_prayer_id))
      errors.push(`${prefix} parent_prayer_id não é um UUID válido`);
    if (p.text && typeof p.text === 'string') {
      const refs = [...p.text.matchAll(/\[prayer:([^\]]+)\]/g)].map((m) => m[1]);
      for (const ref of refs) {
        if (!UUID_RE.test(ref))
          errors.push(`${prefix} referência [prayer:${ref}] deve ser UUID (id de oração existente)`);
      }
    }
  });
  return errors;
}

function prayerToRow(p) {
  return {
    id: p.id ?? undefined,
    title: p.title,
    text: p.text,
    category: p.category,
    tags: p.tags?.length ? p.tags : [],
    image_url: p.image_url ?? null,
    author_id: null,
    author_name: p.author_name ?? 'Tradição da Igreja',
    created_at: p.created_at ?? null,
    prayer_count: typeof p.prayer_count === 'number' ? p.prayer_count : 0,
    latin_text: p.latin_text ?? null,
    parent_prayer_id: p.parent_prayer_id ?? null,
    is_devotion: Boolean(p.is_devotion),
  };
}

function emitSql(prayers, sourceLabel) {
  const header = `-- Gerado por scripts/import-prayers.mjs --emit-sql
-- Fonte: ${sourceLabel} (${prayers.length} orações)
-- Rode no SQL Editor do Supabase com role que ignore RLS (ex.: postgres).

`;

  const colsWithId =
    '(id, title, text, category, tags, image_url, author_id, author_name, created_at, prayer_count, latin_text, parent_prayer_id, is_devotion)';
  const colsNoId =
    '(title, text, category, tags, image_url, author_id, author_name, created_at, prayer_count, latin_text, parent_prayer_id, is_devotion)';

  const withId = prayers.filter((p) => p.id);
  const withoutId = prayers.filter((p) => !p.id);

  const lines = [header];

  function rowValues(r, includeId) {
    const ts = r.created_at ? sqlLiteral(r.created_at) : 'now()';
    const parts = [
      includeId ? sqlLiteral(r.id) : null,
      sqlLiteral(r.title),
      sqlLiteral(r.text),
      sqlLiteral(r.category),
      sqlTextArray(r.tags),
      r.image_url != null ? sqlLiteral(r.image_url) : 'NULL',
      'NULL',
      sqlLiteral(r.author_name),
      ts,
      String(r.prayer_count),
      r.latin_text != null ? sqlLiteral(r.latin_text) : 'NULL',
      r.parent_prayer_id != null ? sqlLiteral(r.parent_prayer_id) : 'NULL',
      r.is_devotion ? 'true' : 'false',
    ].filter((x) => x !== null);
    return `(${parts.join(', ')})`;
  }

  if (withId.length) {
    lines.push(`INSERT INTO public.prayers ${colsWithId}\n`);
    lines.push('VALUES\n');
    lines.push(withId.map((p) => rowValues(prayerToRow(p), true)).join(',\n'));
    lines.push('\nON CONFLICT (id) DO NOTHING;\n\n');
  }

  if (withoutId.length) {
    lines.push(`INSERT INTO public.prayers ${colsNoId}\n`);
    lines.push('VALUES\n');
    lines.push(withoutId.map((p) => rowValues(prayerToRow(p), false)).join(',\n'));
    lines.push(';\n');
  }

  return lines.join('');
}

async function insertSupabase(prayers) {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para --insert');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const rows = prayers.map((p) => {
    const r = prayerToRow(p);
    const row = {
      title: r.title,
      text: r.text,
      category: r.category,
      tags: r.tags,
      image_url: r.image_url,
      author_id: r.author_id,
      author_name: r.author_name,
      prayer_count: r.prayer_count,
      latin_text: r.latin_text,
      parent_prayer_id: r.parent_prayer_id,
      is_devotion: r.is_devotion,
    };
    if (r.id) row.id = r.id;
    return row;
  });
  const { data, error } = await supabase.from('prayers').insert(rows).select('id');
  if (error) {
    console.error('Erro Supabase:', error.message);
    process.exit(1);
  }
  console.log(`Inseridas ${data?.length ?? rows.length} orações.`);
}

const argv = process.argv.slice(2);
const INPUT_PATH = resolveInputPath(argv);
const INPUT_LABEL = INPUT_PATH.replace(ROOT + '/', '');

if (argv.includes('--validate')) {
  const { prayers } = loadPrayers(INPUT_PATH);
  const errors = validate(prayers);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${prayers.length} orações válidas (${INPUT_LABEL}).`);
  process.exit(0);
}

if (argv.includes('--emit-sql')) {
  const { prayers } = loadPrayers(INPUT_PATH);
  const errors = validate(prayers);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  const sql = emitSql(prayers, INPUT_LABEL);
  const outIdx = argv.indexOf('--out');
  const outPath = outIdx >= 0 && argv[outIdx + 1] ? join(ROOT, argv[outIdx + 1]) : null;
  if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, sql, 'utf8');
    console.error(`SQL escrito em ${outPath}`);
  } else {
    process.stdout.write(sql);
  }
  process.exit(0);
}

if (argv.includes('--insert')) {
  const { prayers } = loadPrayers(INPUT_PATH);
  const errors = validate(prayers);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  await insertSupabase(prayers);
  process.exit(0);
}

console.error(
  `Uso: node scripts/import-prayers.mjs [--input caminho.json] --validate | --emit-sql [--out caminho] | --insert`
);
process.exit(1);
