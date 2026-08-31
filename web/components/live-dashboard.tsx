'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG path points use explicit keyboard-accessible roles. */
/* oxlint-disable next/no-html-link-for-pages -- This component is also exported as plain HTML; demo.html is a static artifact, not a Next route. */
import { useEffect, useState } from 'react';
import { Waves, Route, Bell, MapPin, Wind, Navigation, Gauge, Info, ExternalLink, Clock3, RefreshCw, Map, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SOURCE_URL, SOURCE_NAME, validateSnapshot, formatTime, freshness, mapBounds, type Snapshot, type LiveStorm } from '@/lib/live-data';
import land from '@/lib/land.json';

const cities = [{ name: '上海', lon: 121.47, lat: 31.23 }, { name: '宁波', lon: 121.55, lat: 29.87 }, { name: '福州', lon: 119.3, lat: 26.08 }, { name: '厦门', lon: 118.08, lat: 24.48 }, { name: '深圳', lon: 114.06, lat: 22.55 }, { name: '台北', lon: 121.56, lat: 25.03 }];
type GeoFeature = { geometry: { type: string; coordinates: number[][][] | number[][][][] } };
const polygons = (land.features as unknown as GeoFeature[]).flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates as number[][][]] : f.geometry.coordinates as number[][][][]);
const value = (n: number | null | undefined, unit = '') => n == null ? '暂无数据' : String(n) + unit;
const coordinate = (n: number, positive: string, negative: string) => Math.abs(n).toFixed(1) + '°' + (n < 0 ? negative : positive);

function Track({ storm, now }: { storm: LiveStorm; now: number }) {
 const current = storm.points[storm.points.length - 1];
 const [showForecast, setShowForecast] = useState(true);
 const [selected, setSelected] = useState(storm.points.length - 1);
 const [view, setView] = useState<'map' | 'table'>('map');
 const canForecast = storm.active && !freshness(current.time, current.time, now).observationStale;
 const future = canForecast ? storm.forecast : [];
 const points = [...storm.points, ...(showForecast ? future : [])];
 const index = Math.min(selected, points.length - 1), point = points[index];
 const { project, west, east, north, south } = mapBounds([...storm.points, ...future]);
 const line = (items: typeof points) => items.map(p => project(p.lon, p.lat).join(',')).join(' ');
 const [x, y] = project(point.lon, point.lat);
 const kind = index >= storm.points.length ? '预报点' : index === storm.points.length - 1 ? (storm.active ? '最新观测点' : '历史最后观测') : '历史观测点';
 return <section className="panel track-panel" id="track" aria-labelledby="live-track-title">
  <div className="panel-top"><div><h2 id="live-track-title"><Route size={17} />台风路径示意图</h2><p>点击路径点查看详情 · 北京时间 UTC+8</p></div><div className="view-switch"><Button variant="ghost" aria-pressed={view === 'map'} onClick={() => setView('map')} className={view === 'map' ? 'active' : ''}><Map size={14} />地图</Button><Button variant="ghost" aria-pressed={view === 'table'} onClick={() => setView('table')} className={view === 'table' ? 'active' : ''}><List size={14} />列表</Button></div></div>
  <div className="map-toolbar"><div className="map-key"><span><i className="legend-line" />观测轨迹</span><span><i className="legend-line future" />中国预报路径</span></div><label className="forecast-toggle" htmlFor="live-forecast"><Checkbox id="live-forecast" disabled={!future.length} checked={showForecast && future.length > 0} onCheckedChange={v => { setShowForecast(v); setSelected(storm.points.length - 1); }} />显示预报</label></div>
  {view === 'map' ? <div className="map-area live-map">
   <div className="map-watermark">{storm.active ? '观测 / 预报' : '历史资料'}<span>非导航地图</span></div>
   <svg viewBox="0 0 960 580" role="group" aria-label={storm.name + '路径，使用 Tab 选择观测点'}>
    <defs><clipPath id="live-map-clip"><rect width="960" height="580" /></clipPath></defs>
    <g clipPath="url(#live-map-clip)"><rect width="960" height="580" fill="#e9f2f5" />
     {Array.from({ length: Math.floor((east - west) / 5) + 1 }, (_, i) => Math.ceil(west / 5) * 5 + i * 5).filter(lon => lon <= east).map(lon => <g key={lon}><line x1={project(lon, north)[0]} x2={project(lon, north)[0]} y1="0" y2="580" stroke="#d5e4e9" /><text x={project(lon, north)[0]} y="568" className="grid-label">{coordinate(lon, 'E', 'W')}</text></g>)}
     {Array.from({ length: Math.floor((north - south) / 5) + 1 }, (_, i) => Math.ceil(south / 5) * 5 + i * 5).filter(lat => lat <= north).map(lat => <line key={lat} x1="0" x2="960" y1={project(west, lat)[1]} y2={project(west, lat)[1]} stroke="#d5e4e9" />)}
     {polygons.map((polygon, i) => <path key={i} d={polygon.map(ring => ring.map(([lon, lat], j) => (j ? 'L' : 'M') + project(lon, lat).map(n => n.toFixed(2)).join(',')).join(' ') + 'Z').join(' ')} fill="#f8faf9" stroke="#c7d6d9" strokeWidth="1.2" fillRule="evenodd" />)}
     {cities.map(city => { const [cx, cy] = project(city.lon, city.lat); return <g key={city.name}><circle cx={cx} cy={cy} r="3" fill="#829aa3" /><text x={cx - 8} y={cy - 8} textAnchor="end" className="city-label">{city.name}</text></g>; })}
     <polyline points={line(storm.points)} fill="none" stroke="#108c92" strokeWidth="3" strokeLinejoin="round" />
     {showForecast && future.length > 0 && <polyline points={line([current, ...future])} fill="none" stroke="#108c92" strokeWidth="2.5" strokeDasharray="7 7" />}
     {points.map((p, i) => { const [px, py] = project(p.lon, p.lat); return <g key={p.time} className="map-point" tabIndex={0} role="button" aria-label={formatTime(p.time) + (i >= storm.points.length ? ' 预报' : ' 观测') + ' ' + value(p.level, '级')} aria-pressed={i === index} onClick={() => setSelected(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i); } }}><circle cx={px} cy={py} r="15" fill="transparent" /><circle cx={px} cy={py} r={i === storm.points.length - 1 ? 7 : 4} fill={i >= storm.points.length ? '#fff' : i === storm.points.length - 1 ? '#c17c27' : '#108c92'} stroke={i >= storm.points.length ? '#108c92' : '#fff'} strokeWidth="2" /><title>{formatTime(p.time) + ' · ' + value(p.wind, ' m/s')}</title></g>; })}
     <circle cx={x} cy={y} r="12" fill="none" stroke="#203645" strokeWidth="2" pointerEvents="none" />
    </g>
   </svg>
   <div className="map-attribution">自然地球陆地轮廓 · 无行政边界<span>坐标按来源系统绘制</span></div>
  </div> : <div className="live-table"><Table><TableHeader><TableRow><TableHead>北京时间 / 类型</TableHead><TableHead>中心位置</TableHead><TableHead>最大风力</TableHead><TableHead>气压</TableHead></TableRow></TableHeader><TableBody>{points.map((p, i) => <TableRow key={p.time} data-state={i === index ? 'selected' : undefined}><TableCell><Button variant="ghost" onClick={() => setSelected(i)} aria-pressed={i === index}>{formatTime(p.time)} · {i >= storm.points.length ? '预报' : '观测'}</Button></TableCell><TableCell>{coordinate(p.lat, 'N', 'S')} / {coordinate(p.lon, 'E', 'W')}</TableCell><TableCell>{value(p.level, '级')} / {value(p.wind, ' m/s')}</TableCell><TableCell>{value(p.pressure, ' hPa')}</TableCell></TableRow>)}</TableBody></Table></div>}
  <div className="point-detail" aria-live="polite"><div><span className="point-kind">{kind}</span><strong>{formatTime(point.time)}</strong></div><span>{coordinate(point.lat, 'N', 'S')} / {coordinate(point.lon, 'E', 'W')} · {value(point.wind, ' m/s')} · {value(point.pressure, ' hPa')}</span></div>
  <div className="live-point-controls"><Button variant="outline" aria-label="上一个路径点" disabled={index === 0} onClick={() => setSelected(index - 1)}><ChevronLeft />上一点</Button><span>{index + 1} / {points.length}</span><Button variant="outline" aria-label="下一个路径点" disabled={index === points.length - 1} onClick={() => setSelected(index + 1)}>下一点<ChevronRight /></Button><Button variant="ghost" onClick={() => setSelected(storm.points.length - 1)}>最后观测</Button></div>
  <p className="live-track-note">{future.length ? '预报来源：' + storm.forecastAgency + '；起报时间：' + formatTime(storm.forecastIssuedAt!) + '。预报可能调整，路径不代表影响范围。' : storm.active ? '暂无可展示的有效中国预报路径，请前往官方系统查看。' : '此台风已被来源系统标记为非活动状态；这里只展示历史观测，不显示过往预报。'}</p>
 </section>;
}

export default function LiveDashboard({ snapshotUrl = './data/current.json' }: { snapshotUrl?: string }) {
 const [data, setData] = useState<Snapshot | null>(null);
 const [error, setError] = useState(false);
 const [loading, setLoading] = useState(true);
 const [revision, setRevision] = useState(0);
 const [stormId, setStormId] = useState('');
 const [now, setNow] = useState(() => Date.now());
 useEffect(() => {
  const controller = new AbortController();
  let disposed = false;
  async function refresh() {
   setLoading(true);
   try {
    const response = await fetch(new URL(snapshotUrl, document.baseURI), { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
    if (!response.ok) throw new Error('Snapshot unavailable');
    const snapshot: unknown = await response.json();
    validateSnapshot(snapshot);
    if (!disposed) { setData(snapshot); setError(false); setNow(Date.now()); }
   } catch { if (!disposed) setError(true); }
   finally { if (!disposed) setLoading(false); }
  }
  void refresh();
  const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 5 * 60_000);
  return () => { disposed = true; controller.abort(); clearInterval(timer); };
 }, [revision, snapshotUrl]);
 useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
 const storm = data?.storms.find(s => s.id === stormId) || data?.storms.find(s => s.active) || data?.storms[0];
 const current = storm?.points[storm.points.length - 1];
 const { snapshotStale, observationStale } = data ? freshness(data.fetchedAt, storm?.active ? current?.time : undefined, now) : { snapshotStale: true, observationStale: false };
 const status = !data ? loading ? '正在读取数据' : '数据暂不可用' : snapshotStale ? '数据已过期' : error ? '读取更新失败' : '公开数据 · 每小时同步';
 return <div className="live-dashboard">
  <a className="skip-link" href="#overview">跳到主要内容</a>
  <div className="live-ribbon"><Info size={15} /><span>非官方信息汇总网站 · 数据按小时同步，非秒级实况；防灾行动以当地官方最新通知为准。</span></div>
  <header className="site-header"><a className="brand" href="#overview"><span className="brand-symbol"><Waves size={26} /></span><span><span className="brand-name">岸风</span><span className="brand-sub">COASTAL WATCH</span></span></a><nav className="navigation" aria-label="主导航"><a className="nav-active" href="#overview">实况总览</a><a href="#track">台风路径</a><a href="#warnings">预警信息</a></nav><div className="header-end"><a href={SOURCE_URL} target="_blank" rel="noreferrer">浙江官方系统 ↗</a></div></header>
  <main className="page-shell" id="overview">
   <div className="page-heading"><div><div className="eyebrow">TYPHOON MONITOR</div><h1>台风实况与路径</h1><p className="heading-caption">台风叫什么、在哪里、往哪走、风力多大。</p></div><Button variant="outline" className="ui-button" disabled={loading} onClick={() => setRevision(r => r + 1)}><RefreshCw size={15} />{loading ? '读取中…' : '检查已发布更新'}</Button></div>
   <div className={'live-status ' + (snapshotStale || error ? 'is-stale' : '')} role="status"><div><Clock3 size={16} /><strong>{status}</strong></div><p>{data ? '最近成功抓取：' + formatTime(data.fetchedAt) + '（北京时间）' : '正在从本站读取浙江公开数据快照。'}</p><small>{data ? '抓取时间不等于观测时间；页面每 5 分钟检查新快照。' : '读取失败时不会使用演示数据代替。'}</small></div>
   {(snapshotStale && data || error) && <div className="live-warning" role="alert">{data ? '本站更新可能延迟。下方为上次成功取得的资料，不应当作最新实况。' : '暂时无法读取真实数据，请稍后重试。'} <a href={SOURCE_URL} target="_blank" rel="noreferrer">前往官方系统核实 ↗</a></div>}
   {data && data.activeIds.length === 0 && <div className="live-empty"><Waves size={24} /><div><strong>{snapshotStale ? '上次抓取时，来源系统未列出活动台风' : '截至本次抓取，来源系统未列出活动台风'}</strong><p>这不代表没有风雨、海浪或其他风险。{storm ? '下方提供最近台风的历史资料。' : '暂无可展示的历史路径，请查看官方系统。'}</p></div></div>}
   {storm && current ? <>
    <div className="live-storm-picker"><div><span id="live-storm-label">选择台风 / 近期历史</span><Select value={storm.id} onValueChange={id => { if (id) setStormId(id); }}><SelectTrigger className="region-select" aria-labelledby="live-storm-label"><SelectValue>{storm.name} · {storm.id} · {storm.active ? '活动' : '历史'}</SelectValue></SelectTrigger><SelectContent>{data!.storms.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.id} · {s.active ? '活动' : '历史'}</SelectItem>)}</SelectContent></Select></div><span className={storm.active ? 'live-pill' : 'history-pill'}>{storm.active ? '来源标记：活动台风' : '历史资料 · 非当前台风'}</span></div>
    <section className="storm-summary live-summary"><div className="storm-name"><span className="brand-symbol"><Waves /></span><div><h2>{storm.name}<span className="teal-tag">{current.category || '强度未提供'}</span></h2><div className="storm-label">{storm.english} · {storm.id}</div></div></div><div className="live-observation"><strong>{storm.active ? '最新观测时间' : '历史最后观测时间'}</strong><span>{formatTime(current.time)} · 北京时间</span></div></section>
    {observationStale && <div className="live-warning" role="alert">此台风最新观测已超过 6 小时，可能尚未更新；暂不展示预报路径。请核实官方最新资料。</div>}
    <div className="statistics"><section className="stat-card"><div className="stat-label"><MapPin size={16} />{storm.active ? '中心位置' : '历史中心位置'}</div><div className="stat-value coordinate">{coordinate(current.lat, 'N', 'S')}<br />{coordinate(current.lon, 'E', 'W')}</div><div className="stat-foot">来源发布坐标</div></section><section className="stat-card"><div className="stat-label"><Navigation size={16} />移动方向 / 速度</div><div className="stat-value direction">{current.direction || '暂无数据'}</div><div className="stat-foot">{value(current.moveSpeed, ' km/h')} · 移动速度，非风速</div></section><section className="stat-card wind-stat"><div className="stat-label"><Wind size={16} />中心附近最大风力</div><div className="stat-value">{value(current.level, '级')}</div><div className="stat-foot">{value(current.wind, ' m/s')} · 不代表所在地风力</div></section><section className="stat-card"><div className="stat-label"><Gauge size={16} />中心最低气压</div><div className="stat-value">{value(current.pressure)}<small>{current.pressure == null ? '' : 'hPa'}</small></div><div className="stat-foot">{storm.active ? '最新观测' : '历史最后观测'} · 非本地气压</div></section></div>
   </> : <section className="panel live-no-data"><Waves size={32} /><h2>{loading ? '正在读取台风资料' : '暂无可展示的台风资料'}</h2><p>本站不会生成或补造台风名称、位置、风力及预警。</p><a href={SOURCE_URL} target="_blank" rel="noreferrer">查看浙江官方系统 ↗</a></section>}
   <div className="workspace"><div className="main-column">{storm && current && <Track key={storm.id + current.time} storm={storm} now={now} />}<section className="panel live-source"><h2>数据从哪里来？</h2><p><a href={SOURCE_URL} target="_blank" rel="noreferrer">{SOURCE_NAME} <ExternalLink size={13} /></a></p><p>本站每小时读取其公开数据，保留台风名称、观测路径、风力、气压和移动信息。预报仅展示来源系统标注“中国”的路径，不自行推算。</p><p>接口并非有服务保障的开放 API。来源或自动更新出现异常时，本站可能延迟；数据完整性与时效请以官方发布为准。</p><a href="https://github.com/tangdankang/coastal-typhoon-watch/actions/workflows/update-and-deploy.yml" target="_blank" rel="noreferrer">查看自动更新运行记录 ↗</a></section></div>
    <aside className="side-column"><section className="panel" id="warnings"><div className="panel-top"><h2><Bell size={17} />官方预警信息</h2></div><div className="live-warning-card"><span className="history-pill">尚未接入</span><h3>本地预警状态未知</h3><p>当前接入的是台风路径数据，不包含所在地官方预警。本站不会按中心风力自动生成蓝、黄、橙、红预警。</p><a href="https://www.nmc.cn/" target="_blank" rel="noreferrer">查看中央气象台 ↗</a><a href={SOURCE_URL} target="_blank" rel="noreferrer">查看浙江台风路径系统 ↗</a></div><div className="live-color-key" aria-label="预警颜色识别，非当前预警">{[{ text: '蓝色', color: '#327ac0' }, { text: '黄色', color: '#997a12' }, { text: '橙色', color: '#c66a24' }, { text: '红色', color: '#bf4642' }].map(l => <span key={l.text}><i style={{ backgroundColor: l.color }} />{l.text}</span>)}</div><p className="live-track-note">上方仅作颜色识别，不表示任何地区正在预警。“尚未接入”不等于“没有预警”。</p></section><section className="panel live-source"><h2>沿海居民请注意</h2><p>台风中心风力不是所在地风力；路径线也不是影响边界。</p><p>请持续关注当地气象、海洋预警及政府通知，以官方防御和转移安排为准。</p></section></aside>
   </div>
   <footer className="page-footer"><span>岸风 · 非官方信息汇总<br />公开资料辅助查询，不替代官方预报与应急通知。</span><div><a href="./demo.html">查看原演示版（虚构数据）</a><a href="https://github.com/tangdankang/coastal-typhoon-watch" target="_blank" rel="noreferrer">GitHub 仓库 ↗</a></div></footer>
  </main>
 </div>;
}
