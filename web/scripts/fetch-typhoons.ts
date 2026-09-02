/** Public source, low-frequency GET only. No cookies, tokens, signing or proxy bypass. */
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeActivity, normalizeList, normalizeStorm, validateSnapshot, SOURCE_URL, SOURCE_NAME, type Snapshot } from '../lib/live-data.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function getJson(path: string): Promise<unknown> {
 const url = new URL('Api/' + path, SOURCE_URL);
 for (let attempt = 0; attempt < 3; attempt++) {
  try {
   const response = await fetch(url, { signal: AbortSignal.timeout(25_000), redirect: 'error', headers: { Accept: 'application/json', 'User-Agent': 'CoastalTyphoonWatch/1.0 (+https://github.com/tangdankang/coastal-typhoon-watch)' } });
   if (!response.ok) throw new Error('Source HTTP ' + response.status);
   const body = await response.text();
   if (body.length > 8_000_000) throw new Error('Source response too large');
   return JSON.parse(body);
  } catch (error) {
   if (attempt === 2) throw error;
   await new Promise(resolveDelay => setTimeout(resolveDelay, 1500 * (attempt + 1)));
  }
 }
 throw new Error('Source unavailable');
}
export async function collectSnapshot(request: (path: string) => Promise<unknown> = getJson, now = new Date()): Promise<Snapshot> {
// Endpoint spelling "TyhoonActivity" is the spelling actually used by the official site.
const active = normalizeActivity(await request('TyhoonActivity'));
const year = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric' }).format(now));
let yearList = normalizeList(await request('TyphoonList/' + year));
if (!yearList.length) yearList = normalizeList(await request('TyphoonList/' + (year - 1)));
if (yearList.some(s => s.active && !active.some(a => a.id === s.id))) throw new Error('Source activity lists disagree; keep last successful publication');
const recent = yearList.filter(s => !s.active).sort((a, b) => b.endTime.localeCompare(a.endTime)).slice(0, 3);
const selected = [...new Set([...active, ...recent].map(s => s.id))];
if (selected.length > 25) throw new Error('Unexpected number of typhoons');
const storms = [];
for (const id of selected) {
 const storm = normalizeStorm(await request('TyphoonInfo/' + id), id, now.getTime());
 if (storm.active !== active.some(s => s.id === id)) throw new Error('Storm activity changed during fetch; retry next run');
 storms.push(storm);
}
const snapshot: Snapshot = { schemaVersion: 1, fetchedAt: new Date().toISOString(), sourceUrl: SOURCE_URL, sourceName: SOURCE_NAME, activeIds: active.map(s => s.id), storms, warnings: { status: 'not-connected' } };
validateSnapshot(snapshot);
return snapshot;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const snapshot = await collectSnapshot();
const output = resolve(root, 'public/data/current.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output + '.tmp', JSON.stringify(snapshot, null, 2) + '\n');
await rename(output + '.tmp', output);
console.log(JSON.stringify({ fetchedAt: snapshot.fetchedAt, active: snapshot.activeIds.length, historical: snapshot.storms.filter(s => !s.active).length, source: SOURCE_URL }));
}
