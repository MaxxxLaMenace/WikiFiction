// Génère public/data/<univers>.json à partir des wikis Fandom.
// Usage : node scripts/build-cards.mjs [idUnivers...] [--stats]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNIVERSES } from './universes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'data');
const CACHE_DIR = join(ROOT, '.cache');
const USER_AGENT = 'WikiFiction/0.1 (projet perso, génération de cartes)';

// Proportions cumulées par rang de popularité (du plus populaire au moins).
const RARITY_TIERS = [
  { id: 'L', share: 0.03 },
  { id: 'E', share: 0.1 },
  { id: 'R', share: 0.25 },
  { id: 'PC', share: 0.5 },
  { id: 'C', share: 1 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(wiki, params) {
  const url = new URL(`https://${wiki}.fandom.com/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, v);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res.json();
    if (attempt >= 3) throw new Error(`${res.status} sur ${url}`);
    await sleep(1000 * (attempt + 1));
  }
}

async function cached(name, fn) {
  const file = join(CACHE_DIR, `${name}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    const data = await fn();
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(data));
    return data;
  }
}

async function queryPage(wiki, page) {
  const data = await api(wiki, { action: 'query', list: 'querypage', qppage: page, qplimit: '1000' });
  return data.query.querypage.results.filter((r) => r.ns === 0);
}

// Pages (espace principal) d'une catégorie, en descendant de `depth` niveaux.
async function categoryPages(wiki, category, depth, seen = new Set()) {
  if (seen.has(category)) return [];
  seen.add(category);
  const pages = [];
  const subcats = [];
  let cont = {};
  do {
    const data = await api(wiki, { action: 'query', list: 'categorymembers', cmtitle: category, cmtype: 'page|subcat', cmlimit: 'max', ...cont });
    for (const m of data.query?.categorymembers ?? []) {
      if (m.ns === 0) pages.push(m.title);
      else if (m.ns === 14) subcats.push(m.title);
    }
    cont = data.continue ?? null;
  } while (cont);
  if (depth > 0) {
    for (const sub of subcats.slice(0, 40)) pages.push(...(await categoryPages(wiki, sub, depth - 1, seen)));
  }
  return pages;
}

// Catégories, longueur et image pour une liste de titres (par lots de 50).
async function pageDetails(wiki, titles) {
  const pages = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    let cont = {};
    do {
      const data = await api(wiki, {
        action: 'query',
        titles: batch.join('|'),
        prop: 'categories|info|pageimages',
        cllimit: 'max',
        clshow: '!hidden',
        piprop: 'thumbnail',
        pithumbsize: '500',
        redirects: '1',
        ...cont,
      });
      for (const p of data.query?.pages ?? []) {
        if (p.missing) continue;
        const cur = pages.get(p.title) ?? { title: p.title, categories: [] };
        cur.length = p.length ?? cur.length;
        cur.image = p.thumbnail?.source ?? cur.image;
        cur.categories.push(...(p.categories ?? []).map((c) => c.title));
        pages.set(p.title, cur);
      }
      cont = data.continue ?? null;
    } while (cont);
  }
  return [...pages.values()];
}

// Bandeaux de maintenance ou d'avertissement des wikis, à ne pas prendre pour un résumé.
const NOTICE = /^(This (article|page)|There (are|is) (two|three|multiple)|It is requested|Warning!|Content approaching|The (title|capitalization)|[\w' -]+:\s?\S)/;

// Premier paragraphe de l'article, en texte brut. Certains wikis n'ont pas
// d'introduction et commencent directement par une section « Description ».
async function summary(wiki, title) {
  return (await sectionSummary(wiki, title, '0')) ?? (await sectionSummary(wiki, title, '1'));
}

async function sectionSummary(wiki, title, section) {
  const data = await api(wiki, { action: 'parse', page: title, prop: 'text', section, disablelimitreport: '1' });
  // Infobox, tableaux et bandeaux contiennent aussi des <p> : on les retire.
  const html = (data.parse?.text ?? '').replace(/<(aside|table|figure)\b[\s\S]*?<\/\1>/g, '');
  for (const [, p] of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const text = p
      .replace(/<sup[\s\S]*?<\/sup>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 60 && !NOTICE.test(text)) return text.length > 320 ? `${text.slice(0, 317).replace(/\s\S*$/, '')}…` : text;
  }
  return null;
}

function classify(page, universe) {
  const cats = page.categories;
  if (universe.require && !cats.some((c) => universe.require.test(c))) return null;
  if (cats.some((c) => universe.exclude.some((re) => re.test(c)))) return null;
  for (const type of universe.types) {
    if (cats.some((c) => type.match.some((re) => re.test(c)))) return type.id;
  }
  return null;
}

// Rang percentile (0 = le plus faible, 1 = le plus fort) d'une valeur dans une liste.
function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => (sorted.length < 2 ? 1 : sorted.lastIndexOf(v) / (sorted.length - 1));
}

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function buildUniverse(universe, { stats }) {
  const { wiki } = universe;
  console.log(`\n== ${universe.id} (${wiki}.fandom.com)`);
  const linked = await cached(`${wiki}-mostlinked`, () => queryPage(wiki, 'Mostlinked'));
  const long = await cached(`${wiki}-longpages`, () => queryPage(wiki, 'Longpages'));
  const seeded = await cached(`${wiki}-seeds`, async () => {
    const all = [];
    for (const seed of universe.seeds) all.push(...(await categoryPages(wiki, seed, universe.depth)));
    return all;
  });
  const links = new Map(linked.map((r) => [r.title, Number(r.value)]));
  const titles = [...new Set([...linked, ...long].map((r) => r.title).concat(seeded))];
  console.log(`  ${titles.length} pages candidates`);

  const pages = await cached(`${wiki}-details`, () => pageDetails(wiki, titles));
  const seedNames = new Set(universe.seeds.map((s) => s.replace(/^Category:/, '').toLowerCase()));
  const skipped = (title) =>
    title.includes('/') ||
    /^(List of|Timeline of|Unidentified)/i.test(title) ||
    seedNames.has(title.toLowerCase()) ||
    (universe.skip ?? []).some((re) => re.test(title));
  const classified = [];
  const rejected = [];
  for (const page of pages) {
    const type = classify(page, universe);
    const linkedOnly = universe.types.find((t) => t.id === type)?.linked;
    const usable = type && page.image && !skipped(page.title) && (!linkedOnly || links.has(page.title));
    if (usable) classified.push({ ...page, type, links: links.get(page.title) ?? 0 });
    else rejected.push(page);
  }

  // Popularité : surtout la longueur de l'article, les liens entrants en bonus
  // (seules les 1000 pages les plus liées du wiki ont un compte connu).
  const lenRank = percentiles(classified.map((p) => p.length));
  const linkRank = percentiles(classified.map((p) => p.links));
  for (const p of classified) p.score = 0.6 * lenRank(p.length) + 0.4 * (p.links > 0 ? linkRank(p.links) : 0);
  classified.sort((a, b) => b.score - a.score);
  const quotas = Object.fromEntries(universe.types.map((t) => [t.id, t.max]));
  const selected = classified.filter((p) => quotas[p.type]-- > 0);

  const byType = Object.groupBy(selected, (p) => p.type);
  for (const [type, list] of Object.entries(byType)) {
    console.log(`  ${type.padEnd(11)} ${String(list.length).padStart(3)}  ex. ${list.slice(0, 6).map((p) => p.title).join(', ')}`);
  }
  if (stats) {
    console.log(`  Rejetées les plus longues :`);
    for (const p of rejected.sort((a, b) => b.length - a.length).slice(0, 25)) {
      console.log(`    - ${p.title} ${p.image ? '' : '[sans image] '}:: ${p.categories.slice(0, 6).join(' | ')}`);
    }
    return;
  }

  const cards = [];
  let rank = 0;
  for (const p of selected) {
    const share = rank++ / selected.length;
    const rarity = RARITY_TIERS.find((t) => share < t.share).id;
    const text = await cached(`${wiki}-summary-${slug(p.title)}`, () => summary(wiki, p.title));
    cards.push({
      id: slug(p.title),
      name: p.title,
      type: p.type,
      rarity,
      image: p.image,
      summary: text,
      url: `https://${wiki}.fandom.com/wiki/${encodeURIComponent(p.title.replaceAll(' ', '_'))}`,
    });
    process.stdout.write(`\r  résumés ${cards.length}/${selected.length}`);
  }
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, `${universe.id}.json`), JSON.stringify({ universe: universe.id, source: `https://${wiki}.fandom.com`, cards }, null, 1));
  const counts = Object.fromEntries(RARITY_TIERS.map((t) => [t.id, cards.filter((c) => c.rarity === t.id).length]));
  console.log(`\n  ${cards.length} cartes écrites — raretés ${JSON.stringify(counts)}`);
}

const args = process.argv.slice(2);
const stats = args.includes('--stats');
const ids = args.filter((a) => !a.startsWith('--'));
for (const universe of UNIVERSES.filter((u) => ids.length === 0 || ids.includes(u.id))) {
  await buildUniverse(universe, { stats });
}
