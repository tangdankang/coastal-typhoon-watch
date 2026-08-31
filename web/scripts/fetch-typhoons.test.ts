import assert from 'node:assert/strict';
import test from 'node:test';
import { collectSnapshot } from './fetch-typhoons.ts';
const point = { time: '2026-08-31 05:00:00', lng: '165.40', lat: '36.20', speed: '20', power: '8', pressure: '995', forecast: [] };
const listed = { tfid: '202623', name: 'TEST FIXTURE', isactive: '0', endtime: point.time };
const detail = { ...listed, enname: 'TEST', points: [point] };
const now = new Date('2026-08-31T08:00:00Z');
await test('real empty activity list stays empty while historical detail remains explicitly historical', async () => {
 const paths: string[] = [];
 const result = await collectSnapshot(async path => { paths.push(path); return path === 'TyhoonActivity' ? [] : path.startsWith('TyphoonList') ? [listed] : detail; }, now);
 assert.deepEqual(result.activeIds, []); assert.equal(result.storms.length, 1); assert.equal(result.storms[0].active, false);
 assert.deepEqual(paths, ['TyhoonActivity', 'TyphoonList/2026', 'TyphoonInfo/202623']);
 assert.equal(result.warnings.status, 'not-connected');
});
await test('empty year rolls over safely, no invented data when both years are empty', async () => {
 const paths: string[] = [];
 const result = await collectSnapshot(async path => { paths.push(path); return []; }, new Date('2027-01-01T00:00:00Z'));
 assert.deepEqual(result.storms, []); assert.ok(paths.includes('TyphoonList/2026'));
});
await test('active list, yearly list and detail must agree; source errors fail closed', async () => {
 await assert.rejects(collectSnapshot(async () => { throw new Error('Source 503'); }, now), /503/);
 await assert.rejects(collectSnapshot(async path => path === 'TyhoonActivity' ? [] : [{ ...listed, isactive: '1' }], now), /disagree/);
 await assert.rejects(collectSnapshot(async path => path === 'TyhoonActivity' ? [] : path.startsWith('TyphoonList') ? [listed] : { ...detail, isactive: '1' }, now), /activity changed/);
});
await test('multiple active storms and tropical depression IDs are preserved', async () => {
 const active = [{ ...listed, isactive: '1' }, { ...listed, tfid: '20260021', isactive: '1' }];
 const result = await collectSnapshot(async path => path.startsWith('TyphoonInfo/') ? { ...detail, tfid: path.split('/')[1], isactive: '1' } : active, now);
 assert.deepEqual(result.activeIds, ['202623', '20260021']); assert.equal(result.storms.length, 2);
});
