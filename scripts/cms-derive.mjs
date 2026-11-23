// Trim CMS's public Star Ratings data tables to what the desk uses: each contract's ID, its six Part D measure
// scores and stars, its 2025 disaster share and its 2026 stars, plus the Part D cut points. No plan names.
// Run with `npm run cms`. It downloads both zips from cms.gov, checks their SHA-256 and rewrites
// data/cms/star-ratings-2027-partd.json. The app build reads that file and never touches the network.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAGE = 'https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data';
const ZIPS = {
  current: {
    title: '2027 Star Ratings Data Tables (Oct 8 2026)',
    url: 'https://www.cms.gov/files/zip/2027-star-ratings-data-tables-oct-8-2026.zip',
    sha256: '2704032d3f72e71a763aac075a8449e382ca07834417b1da53995b70d54e9967',
  },
  prior: {
    title: '2026 Star Ratings Data Tables',
    url: 'https://www.cms.gov/files/zip/2026-star-ratings-data-tables.zip',
    sha256: 'a72f4f4965239e12b3b264c843a71ea6bbd9c655547be5b1f95b3b0df4d1cde7',
  },
};
export const MEASURE_IDS = ['D08', 'D09', 'D10', 'D11', 'D12', 'D13'];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Measures are matched by name, since CMS renumbers them between years (SUPD was D12 in the 2026 ratings).
const NAMES = {
  D08: /Medication Adherence for Diabetes/i,
  D09: /Medication Adherence for Hypertension/i,
  D10: /Medication Adherence for Cholesterol/i,
  D11: /Statin Use in Persons with Diabetes/i,
  D12: /Concurrent Use of Opioids and Benzodiazepines/i,
  D13: /Anticholinergic/i,
};

// Column index of each measure in a table whose header row names them. Missing measures are an error
// unless `optional`, which the prior year needs because COB and Poly-ACH were not rated before 2027.
function measureColumns(rows, optional = false) {
  const at = rows.findIndex((r) => r.some((h) => NAMES.D08.test(h)));
  if (at < 0) throw new Error('no Part D measure header row');
  const cols = Object.fromEntries(MEASURE_IDS.map((id) => [id, rows[at].findIndex((h) => /^D\d\d:/.test(h.trim()) && NAMES[id].test(h))]));
  for (const [id, c] of Object.entries(cols)) if (c < 0 && !optional) throw new Error(`no column for ${id}`);
  return { header: at, cols };
}

const whole = (v) => (/^\d+%$/.test(v.trim()) ? Number(v.trim().slice(0, -1)) : null);
const star = (v) => (/^[1-5]$/.test(v.trim()) ? Number(v.trim()) : null);
const orgClass = (type) => (/PDP/.test(type) ? 'PDP' : 'MA-PD');

// Cut points as the desk stores them: for higher-is-better the lowest score for 2, 3, 4 and 5 stars,
// for lower-is-better the highest score for 2, 3, 4 and 5 stars.
export function parseCutPoints(rows) {
  const { cols } = measureColumns(rows);
  const out = {};
  for (const r of rows) {
    const org = r[0]?.trim();
    const s = /^([1-5])star$/.exec(r[1]?.trim() || '');
    if (!org || !s || !['MA-PD', 'PDP'].includes(org)) continue;
    const n = Number(s[1]);
    for (const id of MEASURE_IDS) {
      const cell = r[cols[id]].replace(/\s+/g, ' ').trim();
      const m = (out[org] ||= {})[id] ||= { higherIsBetter: null, cut: [null, null, null, null] };
      if (n === 1) { m.higherIsBetter = cell.startsWith('<'); continue; }
      const lower = /^>= ?(\d+)/.exec(cell); // ">= 86 % to < 89 %" or ">= 93 %"
      const upper = /<= ?(\d+)/.exec(cell); // "> 16 % to <= 20 %" or "<= 8 %"
      m.cut[n - 2] = lower ? Number(lower[1]) : upper ? Number(upper[1]) : null;
    }
  }
  return out;
}

function findCsv(dir, pattern) {
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  const hit = walk(dir).find((p) => pattern.test(p));
  if (!hit) throw new Error(`missing ${pattern}`);
  return hit;
}

function fetchZip(z, dir) {
  const file = join(dir, 'data.zip');
  execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0', '-o', file, z.url]);
  const sum = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (sum !== z.sha256) throw new Error(`${z.title}: SHA-256 ${sum} does not match ${z.sha256}. CMS may have replaced the file.`);
  execFileSync('unzip', ['-q', '-o', file, '-d', join(dir, 'x')]);
  return join(dir, 'x');
}

export function derive(currentDir, priorDir) {
  const read = (p) => parseCsv(readFileSync(p, 'latin1'));
  const files = {
    data: findCsv(currentDir, /Measure Data \(Oct 8 2026\)\.csv$/),
    stars: findCsv(currentDir, /Measure Stars \(Oct 8 2026\)\.csv$/),
    summary: findCsv(currentDir, /Summary Ratings \(Oct 8 2026\)\.csv$/),
    cuts: findCsv(currentDir, /Part D Cut Points \(Oct 8 2026\)\.csv$/),
    priorStars: findCsv(priorDir, /2026 Star Ratings Data Table - Measure Stars .*\.csv$/),
  };
  const data = read(files.data);
  const stars = read(files.stars);
  const summary = read(files.summary);
  const prior = read(files.priorStars);
  const d = measureColumns(data);
  const s = measureColumns(stars);
  const p = measureColumns(prior, true);
  const byId = (rows, from) => Object.fromEntries(rows.slice(from).filter((r) => r[0]?.trim()).map((r) => [r[0].trim(), r]));
  const starRows = byId(stars, s.header + 1);
  const priorRows = byId(prior, p.header + 1);
  const sumHeader = summary.findIndex((r) => r.some((h) => h.trim() === '2025 Disaster %'));
  const disasterCol = summary[sumHeader].findIndex((h) => h.trim() === '2025 Disaster %');
  const disaster = Object.fromEntries(summary.slice(sumHeader + 1).filter((r) => r[0]?.trim()).map((r) => [r[0].trim(), Number(r[disasterCol]) || 0]));

  const contracts = data.slice(d.header + 1).filter((r) => /^[A-Z]\d{4}$/.test(r[0]?.trim() || '')).map((r) => {
    const id = r[0].trim();
    const st = starRows[id];
    const pr = priorRows[id];
    return {
      id,
      org: orgClass(r[1]),
      disaster2025: disaster[id] ?? 0,
      score: MEASURE_IDS.map((m) => whole(r[d.cols[m]])),
      star: MEASURE_IDS.map((m) => (st ? star(st[s.cols[m]]) : null)),
      star2026: MEASURE_IDS.map((m) => (pr && p.cols[m] >= 0 ? star(pr[p.cols[m]]) : null)),
    };
  });
  const fileName = (f) => f.split('/').pop();
  return {
    note: 'Trimmed from CMS public Star Ratings data tables: contract ID, the six Part D measures the desk uses, the 2025 disaster share and 2026 stars. No plan names. Regenerate with npm run cms.',
    page: PAGE,
    sources: [
      { ...ZIPS.current, files: [files.data, files.stars, files.summary, files.cuts].map(fileName) },
      { ...ZIPS.prior, files: [fileName(files.priorStars)] },
    ],
    measures: MEASURE_IDS,
    cutPoints: parseCutPoints(read(files.cuts)),
    contracts,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // `--from <2027 folder> <2026 folder>` reuses already unzipped tables instead of downloading.
  const from = process.argv.indexOf('--from');
  let cur;
  let pri;
  if (from > 0) [cur, pri] = process.argv.slice(from + 1, from + 3);
  else {
    const work = mkdtempSync(join(tmpdir(), 'stars-desk-cms-'));
    cur = fetchZip(ZIPS.current, mkdtempSync(join(work, 'c-')));
    pri = fetchZip(ZIPS.prior, mkdtempSync(join(work, 'p-')));
  }
  const out = derive(cur, pri);
  const root = new URL('..', import.meta.url).pathname;
  mkdirSync(`${root}data/cms`, { recursive: true });
  // One contract per line keeps the file reviewable in a diff.
  const body = JSON.stringify({ ...out, contracts: '__C__' }, null, 1)
    .replace('"__C__"', `[\n${out.contracts.map((c) => ` ${JSON.stringify(c)}`).join(',\n')}\n]`);
  writeFileSync(`${root}data/cms/star-ratings-2027-partd.json`, `${body}\n`);
  const ma = out.contracts.filter((c) => c.org === 'MA-PD').length;
  console.log(`wrote data/cms/star-ratings-2027-partd.json: ${out.contracts.length} contracts, ${ma} MA-PD`);
}
