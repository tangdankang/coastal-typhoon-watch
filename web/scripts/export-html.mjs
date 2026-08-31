/** Generates a standalone artifact, never edits source files. */
import { build } from 'esbuild';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = resolve(root, 'dist/client/_next/static/css');
const styles = (await readdir(assets)).filter(name => name.endsWith('.css'));
if (!styles.length) throw new Error('Run npm run build before exporting HTML.');
const css = (await Promise.all(styles.map(name => readFile(resolve(assets, name), 'utf8')))).join('\n');
const result = await build({
 absWorkingDir:root,entryPoints:['scripts/offline-entry.tsx'],bundle:true,write:false,
 platform:'browser',format:'iife',minify:true,jsx:'automatic',target:['es2020'],
 define:{'process.env.NODE_ENV':'"production"'},tsconfig:resolve(root,'tsconfig.json'),
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="台风与预警信息演示，全部数据为虚构样例，不用于防灾决策。"><title>岸风 · 台风信息演示（仅演示使用）</title><style>${css}</style></head><body><noscript>此页面需要启用 JavaScript 才能显示交互演示。所有数据仅为演示使用，不用于防灾决策。</noscript><div id="root"></div><script>${js}</script></body></html>`;
const targetDir = resolve(root, '../网页演示');
await mkdir(targetDir,{recursive:true});
await writeFile(resolve(targetDir,'index.html'),html,'utf8');
console.log('Standalone HTML generated: '+resolve(targetDir,'index.html'));
