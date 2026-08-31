export const SOURCE_URL = 'https://typhoon.slt.zj.gov.cn/';
export const SOURCE_NAME = '浙江省水利厅 · 台风路径实时发布系统';
export const SNAPSHOT_MAX_AGE_MS = 150 * 60_000;
export const OBSERVATION_MAX_AGE_MS = 6 * 60 * 60_000;
export type TrackPoint = { time: string; lon: number; lat: number; wind: number | null; level: number | null; pressure: number | null; direction: string | null; moveSpeed: number | null; category: string | null };
export type LiveStorm = { id: string; name: string; english: string; active: boolean; points: TrackPoint[]; forecast: TrackPoint[]; forecastAgency: string | null; forecastIssuedAt: string | null };
export type Snapshot = { schemaVersion: 1; fetchedAt: string; sourceUrl: string; sourceName: string; activeIds: string[]; storms: LiveStorm[]; warnings: { status: 'not-connected' } };
type Raw = Record<string, unknown>;
function record(value: unknown): Raw {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object from source');
 return value as Raw;
}
function text(value: unknown, max = 100): string | null {
 if (value == null || value === '') return null;
 if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid text field');
 const result = String(value).trim();
 if (result.length > max) throw new Error('Text field too long');
 return result || null;
}
export function sourceTime(value: unknown): string {
 const raw = text(value);
 if (!raw) throw new Error('Missing source time');
 const local = raw.replace(' ', 'T');
 if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(local)) throw new Error('Invalid source time');
 const [year, month, day, hour, minute, second] = local.slice(0, 19).split(/[-T:]/).map(Number);
 if (year < 1900 || year > 2200 || hour > 23 || minute > 59 || second > 59 || new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== local.slice(0, 10)) throw new Error('Invalid calendar date');
 const zoned = /(?:Z|[+-]\d{2}:\d{2})$/.test(local) ? local : local + '+08:00';
 if (!Number.isFinite(Date.parse(zoned))) throw new Error('Invalid date');
 return new Date(zoned).toISOString();
}
function number(value: unknown, min: number, max: number, required = false): number | null {
 if (value == null || (typeof value === 'string' && ['', '--', 'null'].includes(value.trim()))) {
  if (required) throw new Error('Missing coordinate');
  return null;
 }
 if (typeof value !== 'number' && typeof value !== 'string') throw new Error('Invalid number');
 const result = Number(value);
 if (!Number.isFinite(result) || result < min || result > max) throw new Error('Out-of-range source number');
 return result;
}
export function normalizePoint(input: unknown): TrackPoint {
 const p = record(input);
 return { time: sourceTime(p.time), lon: number(p.lng, -180, 180, true)!, lat: number(p.lat, -90, 90, true)!, wind: number(p.speed, 0, 150), level: number(p.power, 0, 25), pressure: number(p.pressure, 800, 1100), direction: text(p.movedirection), moveSpeed: number(p.movespeed, 0, 250), category: text(p.strong) };
}
export function normalizeList(input: unknown): { id: string; active: boolean; endTime: string }[] {
 if (!Array.isArray(input) || input.length > 200) throw new Error('Invalid typhoon list');
 return input.map(item => {
  const r = record(item), id = text(r.tfid);
  if (!id || !/^\d{6,8}$/.test(id) || !['0', '1'].includes(String(r.isactive))) throw new Error('Invalid typhoon identity/status');
  return { id, active: String(r.isactive) === '1', endTime: sourceTime(r.endtime || r.starttime) };
 });
}
export function normalizeStorm(input: unknown, expectedId: string, now = Date.now()): LiveStorm {
 const raw = record(Array.isArray(input) && input.length === 1 ? input[0] : input);
 if (String(raw.tfid) !== expectedId || !/^\d{6,8}$/.test(expectedId)) throw new Error('Source typhoon ID mismatch');
 if (!['0', '1'].includes(String(raw.isactive))) throw new Error('Missing activity status');
 if (!Array.isArray(raw.points) || !raw.points.length || raw.points.length > 5000) throw new Error('Missing/excessive track points');
 const points = raw.points.map(normalizePoint).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
 for (let i = 0; i < points.length; i++) {
  if (Date.parse(points[i].time) > now + 15 * 60_000) throw new Error('Observation is in the future');
  if (i && points[i].time === points[i - 1].time) throw new Error('Duplicate observation time');
 }
 const current = points[points.length - 1];
 const lastRaw = record(raw.points.find(p => normalizePoint(p).time === current.time));
 const agencies = lastRaw.forecast == null ? [] : lastRaw.forecast;
 if (!Array.isArray(agencies)) throw new Error('Invalid forecast list');
 const china = agencies.map(record).find(f => f.tm === '中国');
 const active = String(raw.isactive) === '1';
 let forecast: TrackPoint[] = [];
 if (active && china) {
  if (!Array.isArray(china.forecastpoints)) throw new Error('Invalid China forecast');
  forecast = china.forecastpoints.map(normalizePoint).filter(p => p.time > current.time).sort((a, b) => a.time.localeCompare(b.time));
 }
 const name = text(raw.name), english = text(raw.enname) || '';
 if (!name) throw new Error('Missing typhoon name');
 const forecastAnchor = china && Array.isArray(china.forecastpoints) && china.forecastpoints.length ? record(china.forecastpoints[0]) : null;
 return { id: expectedId, name, english, active, points, forecast, forecastAgency: forecast.length ? '中国（来源系统标注）' : null, forecastIssuedAt: forecast.length && forecastAnchor ? sourceTime(forecastAnchor.ybsj || forecastAnchor.time) : null };
}
export function validateSnapshot(input: unknown): asserts input is Snapshot {
 const data = record(input);
 if (data.schemaVersion !== 1 || data.sourceUrl !== SOURCE_URL || !Array.isArray(data.storms) || !Array.isArray(data.activeIds)) throw new Error('Invalid snapshot');
 sourceTime(data.fetchedAt);
 if (data.storms.length > 25 || record(data.warnings).status !== 'not-connected') throw new Error('Invalid snapshot metadata');
 const ids = new Set<string>();
 for (const value of data.storms) {
  const s = record(value);
  if (typeof s.id !== 'string' || !/^\d{6,8}$/.test(s.id) || ids.has(s.id) || typeof s.name !== 'string' || !s.name || typeof s.english !== 'string' || typeof s.active !== 'boolean') throw new Error('Invalid storm');
  ids.add(s.id);
  if (!Array.isArray(s.points) || !s.points.length || !Array.isArray(s.forecast) || (!s.active && s.forecast.length)) throw new Error('Invalid track');
  if (s.points.length > 5000 || s.forecast.length > 100) throw new Error('Excessive track size');
  if (s.forecast.length && (typeof s.forecastAgency !== 'string' || typeof s.forecastIssuedAt !== 'string')) throw new Error('Missing forecast source');
  if (s.forecastIssuedAt != null) sourceTime(s.forecastIssuedAt);
  let previous = '';
  for (const v of [...s.points, ...s.forecast]) {
   const p = record(v), t = sourceTime(p.time);
   if (typeof p.lon !== 'number' || typeof p.lat !== 'number') throw new Error('Invalid coordinate type');
   for (const key of ['wind', 'level', 'pressure', 'moveSpeed']) if (p[key] !== null && typeof p[key] !== 'number') throw new Error('Invalid numeric type');
   for (const key of ['direction', 'category']) if (p[key] !== null && typeof p[key] !== 'string') throw new Error('Invalid label type');
   if (previous && t <= previous) throw new Error('Unordered track');
   previous = t;
   number(p.lon, -180, 180, true); number(p.lat, -90, 90, true);
   number(p.wind, 0, 150); number(p.level, 0, 25); number(p.pressure, 800, 1100); number(p.moveSpeed, 0, 250);
  }
 }
 const compareIds = (a: unknown, b: unknown) => String(a).localeCompare(String(b));
 const activeIds = data.storms.filter(s => record(s).active).map(s => record(s).id).sort(compareIds);
 if (JSON.stringify(activeIds) !== JSON.stringify([...data.activeIds].sort(compareIds))) throw new Error('Active storm mismatch');
}
export function freshness(fetchedAt: string, observedAt?: string, now = Date.now()) {
 const age = now - Date.parse(fetchedAt);
 return { snapshotStale: !Number.isFinite(age) || age > SNAPSHOT_MAX_AGE_MS || age < -15 * 60_000, observationStale: observedAt ? now - Date.parse(observedAt) > OBSERVATION_MAX_AGE_MS : false };
}
export function formatTime(value: string) {
 return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
export function mapBounds(points: Pick<TrackPoint, 'lon' | 'lat'>[]) {
 // Include China's coast and every observation; no invented forecast or risk radius.
 const west = Math.max(-180, Math.min(110, ...points.map(p => p.lon)) - 3);
 const east = Math.min(180, Math.max(132, ...points.map(p => p.lon)) + 3);
 const south = Math.max(-90, Math.min(15, ...points.map(p => p.lat)) - 3);
 const north = Math.min(90, Math.max(35, ...points.map(p => p.lat)) + 3);
 return { west, east, south, north, project: (lon: number, lat: number) => [40 + (lon - west) / (east - west) * 880, 540 - (lat - south) / (north - south) * 500] };
}
