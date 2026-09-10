#!/usr/bin/env node
/**
 * CatolicoApp — coleta via WordPress REST API.
 *
 * Modo padrão (recomendado): tipo de post `oracoes` (/wp/v2/oracoes), onde estão as orações do site.
 * Modo blog (--blog): posts/páginas normais (categorias WP); sem filtro traz muito artigo, não oração.
 *
 * AVISO LEGAL: direitos autorais e ToS do site de origem — uso por sua conta e risco.
 *
 * Uso:
 *   node scripts/scrape-catolicoapp.mjs
 *   node scripts/scrape-catolicoapp.mjs --max-pages 30 --delay-ms 800
 *   node scripts/scrape-catolicoapp.mjs --full-content
 * Quando a página tem um título h2–h4 com "latim" / "língua latina" / "versão latina", o trecho
 * seguinte (até ao próximo h2) vai para o campo latin_text no JSON.
 *   node scripts/scrape-catolicoapp.mjs --discover-tipos-oracao
 *   node scripts/scrape-catolicoapp.mjs --discover-categories
 *   node scripts/scrape-catolicoapp.mjs --blog --include-all-posts
 *   node scripts/scrape-catolicoapp.mjs --blog --category-slugs=catecismo
 */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'data', 'prayers-scraped-catolicoapp.json');

const BASE = (process.env.CATOLICOAPP_BASE || 'https://catolicoapp.com').replace(/\/$/, '');

const SKIP_SLUGS = new Set([
  'politica-de-privacidade',
  'politica-de-privacidade-2',
  'termos-de-uso',
  'contato',
  'sobre',
  'blog',
  'sample-page',
  'pedidos-de-oracao',
]);

const UA =
  'Mozilla/5.0 (compatible; TECA-prayer-catalog/1.0; +https://github.com/) AppleWebKit/537.36';

function parseArgs() {
  const a = process.argv.slice(2);
  const getN = (flag, def) => {
    const i = a.indexOf(flag);
    if (i >= 0 && a[i + 1]) return Math.max(0, parseInt(a[i + 1], 10) || def);
    return def;
  };
  const getS = (flag) => {
    const i = a.indexOf(flag);
    if (i >= 0 && a[i + 1]) return a[i + 1];
    const eq = a.find((x) => x.startsWith(`${flag}=`));
    if (eq) return eq.slice(flag.length + 1);
    return '';
  };
  const categorySlugs = getS('--category-slugs')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    blog: a.includes('--blog'),
    discoverCategories: a.includes('--discover-categories'),
    discoverTiposOracao: a.includes('--discover-tipos-oracao'),
    discoverRoutes: a.includes('--discover-routes'),
    includeAllPosts: a.includes('--include-all-posts'),
    categorySlugs,
    fullContent: a.includes('--full-content'),
    maxPages: getN('--max-pages', 80),
    delayMs: getN('--delay-ms', 800),
    minTextLen: getN('--min-text', 40),
    skipLiturgia: !a.includes('--include-liturgia'),
    postsOnly: a.includes('--posts-only'),
    includePages: a.includes('--include-pages'),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status} ${url}\n${t.slice(0, 400)}`);
  }
  return res.json();
}

function decodeEntities(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripShortcodes(s) {
  return s.replace(/\[[\w_-]+[^\]]*\]/g, ' ');
}

/** Remove mídia e, por defeito, texto após o primeiro <h2> (vídeos, “quando rezar”, etc.). */
function stripOracaoHtml(html, fullContent) {
  let h = html || '';
  h = h.replace(/<figure[\s\S]*?<\/figure>/gi, '');
  h = h.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  h = h.replace(/<img\b[^>]*>/gi, '');
  if (!fullContent) {
    const re = /<h2\b[^>]*>/i;
    const m = h.match(re);
    if (m && m.index != null && m.index > 40) h = h.slice(0, m.index);
  }
  return h;
}

function htmlToPlain(html) {
  let s = decodeEntities(html);
  s = stripShortcodes(s);
  s = s.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.replace(/\s+/g, ' ').replace(/ \n/g, '\n').trim();
}

/** Texto plano do interior de um título (h2–h4). */
function headingInnerPlain(html) {
  return decodeEntities((html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai versão em latim quando o CatolicoApp usa um título do tipo
 * "… em latim" / "língua latina" antes do parágrafo latino.
 */
function extractLatinFromHtml(html) {
  if (!html) return null;
  const LAT = /\b(latim|língua\s+latina|lingua\s+latina|vers[aã]o\s+latina)\b/i;
  const hRe = /<h([234])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  let latinStart = -1;
  while ((m = hRe.exec(html)) !== null) {
    if (LAT.test(headingInnerPlain(m[2]))) {
      latinStart = m.index + m[0].length;
      break;
    }
  }
  if (latinStart < 0) return null;

  let rest = html.slice(latinStart);
  const nextH2 = rest.search(/<h2\b/i);
  const chunk = nextH2 >= 0 ? rest.slice(0, nextH2) : rest;
  const cleaned = chunk
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<hr\b[^>]*\/?>/gi, '\n');

  const plain = htmlToPlain(cleaned);
  if (!plain || plain.length < 12) return null;
  return plain;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainToAppHtml(plain) {
  if (!plain) return '';
  return plain
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => escapeHtml(p).replace(/\n/g, '<br/>'))
    .join('<br/><br/>');
}

function mapCategory(names) {
  const t = names.join(' ').toLowerCase();
  if (/maria|marian|terço|terco|rosário|rosario|novena|ave|salve|ladainha/.test(t)) return 'Marianas';
  if (/santo|santa|biograf|história|historia|intercess/.test(t)) return 'Santos';
  if (/família|familia|casamento|lar|mesa|refei|cotidiano|manhã|manha|noite/.test(t))
    return 'Momentos da Vida';
  if (/inten|paz|mundo|cura|especial|necessidade|quaresma/.test(t)) return 'Intenção Especial';
  return 'Diárias';
}

function mapTipoSlugToCategory(slugs) {
  const t = slugs.join(' ').toLowerCase();
  if (/rosario|tercos|ladainhas/.test(t)) return 'Marianas';
  if (/intercessao-dos-santos/.test(t)) return 'Santos';
  if (/cotidiano/.test(t)) return 'Momentos da Vida';
  if (/quaresmal/.test(t)) return 'Intenção Especial';
  return 'Diárias';
}

async function loadCategoryMap() {
  const cats = await fetchJson(
    `${BASE}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,count`
  );
  const byId = {};
  const slugToId = {};
  for (const c of cats) {
    byId[c.id] = c.name;
    slugToId[c.slug] = c.id;
  }
  return { byId, slugToId, list: cats };
}

async function loadTiposOracaoMap() {
  const terms = await fetchJson(
    `${BASE}/wp-json/wp/v2/tipos-de-oracao?per_page=100&_fields=id,name,slug`
  );
  const byId = {};
  const slugById = {};
  for (const t of terms) {
    byId[t.id] = t.name;
    slugById[t.id] = t.slug;
  }
  return { byId, slugById };
}

async function resolveCategoryIds(slugs, slugToId) {
  const ids = [];
  const missing = [];
  for (const slug of slugs) {
    const id = slugToId[slug];
    if (id != null) ids.push(id);
    else missing.push(slug);
  }
  return { ids, missing };
}

function namesForPost(post, catById) {
  const ids = post.categories || [];
  return ids.map((id) => catById[id] || '').filter(Boolean);
}

function tipoSlugsForOracao(item, slugById) {
  const key = 'tipos-de-oracao';
  const ids = item[key] || [];
  return ids.map((id) => slugById[id] || '').filter(Boolean);
}

async function collectOracoes(tipoSlugById, opts) {
  const out = [];
  const seen = new Set();

  for (let page = 1; page <= opts.maxPages; page++) {
    const url = `${BASE}/wp-json/wp/v2/oracoes?per_page=50&page=${page}&_fields=id,slug,title,link,content,tipos-de-oracao`;
    let items;
    try {
      items = await fetchJson(url);
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const slug = item.slug || '';
      if (!slug || SKIP_SLUGS.has(slug) || seen.has(slug)) continue;
      if (opts.skipLiturgia && /liturgia/i.test(slug)) continue;

      const raw = item.content?.rendered || '';
      const latinPlain = extractLatinFromHtml(raw);
      const trimmed = stripOracaoHtml(raw, opts.fullContent);
      const plain = htmlToPlain(trimmed);
      if (plain.length < opts.minTextLen) continue;

      seen.add(slug);
      const tipoSlugs = tipoSlugsForOracao(item, tipoSlugById);

      const title =
        typeof item.title?.rendered === 'string'
          ? decodeEntities(item.title.rendered).replace(/<[^>]+>/g, '').trim()
          : slug;

      const tagTipo = tipoSlugs[0] ? `#${tipoSlugs[0].slice(0, 40)}` : '#oracao';

      const row = {
        title: title || slug,
        text: plainToAppHtml(plain),
        category: mapTipoSlugToCategory(tipoSlugs),
        tags: ['#catolicoapp', tagTipo],
        author_name: 'CatolicoApp (scraping — revisar direitos e texto)',
        prayer_count: 0,
        is_devotion: /rosario|terco|terço|noven/i.test(slug + title),
        source_url: item.link || `${BASE}/oracao/${slug}/`,
        source_slug: slug,
        source_wp_type: 'oracoes',
      };
      if (latinPlain) row.latin_text = latinPlain;
      out.push(row);
    }

    await sleep(opts.delayMs);
  }
  return out;
}

async function collectPosts(catById, opts, seenSlugs, categoryIds) {
  const out = [];
  const catQuery =
    categoryIds.length > 0 ? `&categories=${encodeURIComponent(categoryIds.join(','))}` : '';

  for (let page = 1; page <= opts.maxPages; page++) {
    const url = `${BASE}/wp-json/wp/v2/posts?per_page=20&page=${page}&_fields=id,slug,title,link,content,categories${catQuery}`;
    let items;
    try {
      items = await fetchJson(url);
    } catch (e) {
      if (page === 1) console.warn('[posts] página 1 falhou:', e.message);
      break;
    }
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const slug = item.slug || '';
      if (!slug || SKIP_SLUGS.has(slug) || seenSlugs.has(slug)) continue;
      if (opts.skipLiturgia && /liturgia/i.test(slug)) continue;

      const rawHtml = item.content?.rendered || '';
      const latinPlain = extractLatinFromHtml(rawHtml);
      const plain = htmlToPlain(rawHtml);
      if (plain.length < opts.minTextLen) continue;

      seenSlugs.add(slug);
      const catNames = namesForPost(item, catById);
      const title =
        typeof item.title?.rendered === 'string'
          ? decodeEntities(item.title.rendered).replace(/<[^>]+>/g, '').trim()
          : slug;

      const prow = {
        title: title || slug,
        text: plainToAppHtml(plain),
        category: mapCategory(catNames),
        tags: ['#catolicoapp', `#${slug.slice(0, 48)}`],
        author_name: 'CatolicoApp (scraping — revisar direitos e texto)',
        prayer_count: 0,
        is_devotion: false,
        source_url: item.link || `${BASE}/${slug}/`,
        source_slug: slug,
        source_wp_type: 'post',
      };
      if (latinPlain) prow.latin_text = latinPlain;
      out.push(prow);
    }

    await sleep(opts.delayMs);
  }
  return out;
}

async function collectPages(catById, opts, seenSlugs) {
  const out = [];
  for (let page = 1; page <= opts.maxPages; page++) {
    const url = `${BASE}/wp-json/wp/v2/pages?per_page=20&page=${page}&_fields=id,slug,title,link,content,categories`;
    let items;
    try {
      items = await fetchJson(url);
    } catch (e) {
      if (page === 1) console.warn('[pages] página 1 falhou:', e.message);
      break;
    }
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      const slug = item.slug || '';
      if (!slug || SKIP_SLUGS.has(slug) || seenSlugs.has(slug)) continue;
      if (opts.skipLiturgia && /liturgia/i.test(slug)) continue;

      const rawHtml = item.content?.rendered || '';
      const latinPlain = extractLatinFromHtml(rawHtml);
      const plain = htmlToPlain(rawHtml);
      if (plain.length < opts.minTextLen) continue;

      seenSlugs.add(slug);
      const catNames = namesForPost(item, catById);
      const title =
        typeof item.title?.rendered === 'string'
          ? decodeEntities(item.title.rendered).replace(/<[^>]+>/g, '').trim()
          : slug;

      const wrow = {
        title: title || slug,
        text: plainToAppHtml(plain),
        category: mapCategory(catNames),
        tags: ['#catolicoapp', `#${slug.slice(0, 48)}`],
        author_name: 'CatolicoApp (scraping — revisar direitos e texto)',
        prayer_count: 0,
        is_devotion: false,
        source_url: item.link || `${BASE}/${slug}/`,
        source_slug: slug,
        source_wp_type: 'page',
      };
      if (latinPlain) wrow.latin_text = latinPlain;
      out.push(wrow);
    }

    await sleep(opts.delayMs);
  }
  return out;
}

async function main() {
  const opts = parseArgs();

  if (opts.discoverRoutes) {
    const idx = await fetchJson(`${BASE}/wp-json/`);
    const routes = Object.keys(idx.routes || {}).filter(
      (k) => /prayer|oracao|orac|jet|listing/i.test(k)
    );
    console.log(JSON.stringify(routes.sort(), null, 2));
    return;
  }

  if (opts.discoverTiposOracao) {
    const terms = await fetchJson(
      `${BASE}/wp-json/wp/v2/tipos-de-oracao?per_page=100&_fields=id,slug,name,count`
    );
    for (const t of terms) {
      console.log(`${t.slug}\tid=${t.id}\t${t.name}`);
    }
    return;
  }

  if (opts.discoverCategories) {
    const { list } = await loadCategoryMap();
    list.sort((a, b) => (b.count || 0) - (a.count || 0));
    for (const c of list) {
      console.log(`${c.slug}\tcount=${c.count}\t${c.name}`);
    }
    console.error('\nPara artigos de blog: --blog --category-slugs=SLUG1,SLUG2');
    return;
  }

  mkdirSync(join(ROOT, 'data'), { recursive: true });
  console.error(`Base: ${BASE}`);

  if (!opts.blog) {
    const { slugById } = await loadTiposOracaoMap();
    console.error('Modo: CPT oracoes (padrão)');
    console.error(`max-pages: ${opts.maxPages}, delay: ${opts.delayMs}ms, full-content: ${opts.fullContent}`);
    const prayers = await collectOracoes(slugById, opts);
    const payload = {
      _meta: {
        format_version: 1,
        source_site: BASE,
        source_cpt: 'oracoes',
        scraped_at: new Date().toISOString(),
        strip_rule: opts.fullContent ? 'none' : 'remove_after_first_h2_and_media',
        latin_rule:
          'latin_text quando um h2–h4 contém "latim", "língua latina" ou "versão latina"; texto até ao próximo h2',
        license_note:
          'Conteúdo obtido automaticamente de terceiros. Não republicar sem verificar direitos autorais e termos do site de origem.',
        count: prayers.length,
      },
      prayers,
    };
    writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
    console.error(`Escrito ${prayers.length} orações em ${OUT}`);
    return;
  }

  const needAll = opts.includeAllPosts;
  const needCats = opts.categorySlugs.length > 0;
  if (!needAll && !needCats) {
    console.error(
      'Modo --blog: use --include-all-posts ou --category-slugs=a,b\n' +
        '  (sem --blog, o script usa só o tipo de post oracoes.)'
    );
    process.exit(1);
  }

  console.error(`Modo blog — max-pages: ${opts.maxPages}, delay: ${opts.delayMs}ms`);
  const { byId: catById, slugToId } = await loadCategoryMap();
  let categoryIds = [];
  if (needCats) {
    const { ids, missing } = await resolveCategoryIds(opts.categorySlugs, slugToId);
    if (missing.length) {
      console.error('Slugs não encontrados:', missing.join(', '));
      process.exit(1);
    }
    categoryIds = ids;
    console.error('Categorias (IDs):', categoryIds.join(', '));
  }

  const seenSlugs = new Set();
  const posts = await collectPosts(catById, opts, seenSlugs, categoryIds);
  let pages = [];
  const fetchPages =
    opts.includePages ||
    (opts.includeAllPosts && !opts.postsOnly && categoryIds.length === 0);
  if (fetchPages) {
    pages = await collectPages(catById, opts, seenSlugs);
  }
  const prayers = [...posts, ...pages];

  const payload = {
    _meta: {
      format_version: 1,
      source_site: BASE,
      scraped_at: new Date().toISOString(),
      filter:
        categoryIds.length > 0
          ? { category_slugs: opts.categorySlugs, category_ids: categoryIds }
          : { include_all_posts: true, pages_included: fetchPages },
      license_note:
        'Conteúdo obtido automaticamente de terceiros. Não republicar sem verificar direitos autorais e termos do site de origem.',
      count: prayers.length,
    },
    prayers,
  };

  writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.error(`Escrito ${prayers.length} itens em ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
