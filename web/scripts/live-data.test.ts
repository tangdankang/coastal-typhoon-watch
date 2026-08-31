import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceTime, normalizePoint, normalizeStorm, normalizeList, validateSnapshot, freshness, mapBounds, SOURCE_URL, type Snapshot } from '../lib/live-data.ts';
export const rawPoint = { time: '2026-08-31 05:00:00', lng: '165.40', lat: '36.20', speed: '20', power: '8', pressure: '995', movespeed: '0', movedirection: '北', strong: '热带风暴', forecast: [] as unknown[] };
export const rawStorm = { tfid: '202623', name: '测试资料（仅单元测试）', enname: 'TEST', isactive: '0', points: [rawPoint] };
const now = Date.parse('2026-08-31T08:00:00Z');
await test('Beijing timestamps are parsed explicitly and invalid dates rejected', () => {
 assert.equal(sourceTime(rawPoint.time), '2026-08-30T21:00:00.000Z');
 assert.equal(sourceTime('2026-08-31T05:00:00+08:00'), sourceTime(rawPoint.time));
 for (const date of ['2026-02-30 08:00:00', '2026-13-01 08:00:00', '2026-08-31 24:00:00', 'oops']) assert.throws(() => sourceTime(date));
});
await test('zero is not missing; missing is not invented; source units preserved', () => {
 const point = normalizePoint(rawPoint);
 assert.equal(point.moveSpeed, 0); assert.equal(point.wind, 20); assert.equal(point.pressure, 995);
 assert.equal(normalizePoint({ ...rawPoint, speed: '--' }).wind, null);
 assert.throws(() => normalizePoint({ ...rawPoint, lng: '' }));
 assert.throws(() => normalizePoint({ ...rawPoint, lat: '95' }));
 assert.throws(() => normalizePoint({ ...rawPoint, pressure: '<script>' }));
});
await test('strict typhoon IDs, status and observation chronology', () => {
 assert.equal(normalizeStorm(rawStorm, '202623', now).active, false);
 assert.throws(() => normalizeStorm(rawStorm, '202622', now));
 assert.throws(() => normalizeStorm({ ...rawStorm, isactive: null }, '202623', now));
 assert.throws(() => normalizeStorm({ ...rawStorm, points: [rawPoint, rawPoint] }, '202623', now));
 assert.throws(() => normalizeStorm({ ...rawStorm, points: [{ ...rawPoint, time: '2027-01-01 08:00:00' }] }, '202623', now));
 assert.throws(() => normalizeList({ message: 'error' }));
 assert.throws(() => normalizeList([{ tfid: '../../escape', isactive: '1' }]));
 assert.deepEqual(normalizeList([]), []);
});
await test('only Chinese forecasts for active storms; historical forecasts never presented as current', () => {
 const forecast = [{ tm: '中国', forecastpoints: [rawPoint, { ...rawPoint, time: '2026-08-31 17:00:00' }] }, { tm: '日本', forecastpoints: [{ ...rawPoint, time: '2026-08-31 20:00:00' }] }];
 const active = normalizeStorm({ ...rawStorm, isactive: '1', points: [{ ...rawPoint, forecast }] }, '202623', now);
 assert.equal(active.forecast.length, 1); assert.equal(active.forecastIssuedAt, sourceTime(rawPoint.time));
 assert.equal(normalizeStorm({ ...rawStorm, points: [{ ...rawPoint, forecast }] }, '202623', now).forecast.length, 0);
});
await test('snapshot validation rejects demo, malformed and mismatched activity data', () => {
 const good: Snapshot = { schemaVersion: 1, sourceUrl: SOURCE_URL, sourceName: '浙江省水利厅', fetchedAt: new Date(now).toISOString(), activeIds: [], storms: [normalizeStorm(rawStorm, '202623', now)], warnings: { status: 'not-connected' } };
 assert.doesNotThrow(() => validateSnapshot(good));
 assert.throws(() => validateSnapshot({ ...good, activeIds: ['202623'] }));
 assert.throws(() => validateSnapshot({ ...good, sourceUrl: 'https://untrusted.example/' }));
 const broken = structuredClone(good) as unknown as { storms: { points: { lon: unknown }[] }[] };
 broken.storms[0].points[0].lon = '165.4'; assert.throws(() => validateSnapshot(broken));
 assert.throws(() => validateSnapshot({ ...good, warnings: { status: 'safe' } }));
});
await test('snapshot freshness and observation freshness are separate, with future-clock protection', () => {
 assert.deepEqual(freshness(new Date(now).toISOString(), '2026-08-30T21:00:00Z', now), { snapshotStale: false, observationStale: true });
 assert.equal(freshness(new Date(now - 151 * 60_000).toISOString(), undefined, now).snapshotStale, true);
 assert.equal(freshness(new Date(now + 60 * 60_000).toISOString(), undefined, now).snapshotStale, true);
});
await test('map bounds include tracks beyond original demo viewport and negative latitudes', () => {
 const points = [{ lon: 165.4, lat: 36.2 }, { lon: 170, lat: 52 }, { lon: 120, lat: -10 }];
 const bounds = mapBounds(points);
 for (const p of points) { const [x, y] = bounds.project(p.lon, p.lat); assert.ok(x >= 40 && x <= 920 && y >= 40 && y <= 540); }
});
