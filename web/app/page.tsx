'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG path groups need explicit keyboard-accessible roles; view groups use composed shadcn buttons. */

import { useEffect, useState } from 'react';
import { Waves, LayoutDashboard, Route, Bell, MapPin, Wind, Navigation, Gauge, Info, ArrowUpRight, ArrowRight, CircleHelp, Clock3, Play, Pause, LocateFixed, Plus, Minus, List, Map, ShieldCheck, ChevronRight, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { CURRENT_INDEX, DEMO_NOTICE, DEMO_TIME, storms, regions, levels, getStorm, getRegion, pointLabel, projectPoint, type AlertLevel } from '@/lib/demo-data';
import land from '@/lib/land.json';

type GeoFeature = { geometry: { type:string; coordinates:number[][][]|number[][][][] } };
const landPaths = (land.features as unknown as GeoFeature[]).flatMap(feature => {
 const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
 return polygons.filter(p => p[0].some(([lon,lat]) => lon>=108 && lon<=142 && lat>=10 && lat<=40)).map(polygon =>
  polygon.map(ring => ring.map(([lon,lat],i) => {const [x,y]=projectPoint(lon,lat);return (i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}).join(' ')+'Z').join(' '));
});
const cities = [
 {label:'上海',lon:121.47,lat:31.23},{label:'宁波',lon:121.55,lat:29.87},
 {label:'福州',lon:119.3,lat:26.08},{label:'厦门',lon:118.08,lat:24.48},
 {label:'深圳',lon:114.06,lat:22.55},{label:'台北',lon:121.56,lat:25.03},
];
const guides = [
 {number:'01',title:'先看所在地预警',description:'全国台风动态不能替代本地官方预警。'},
 {number:'02',title:'分清中心风力与本地风力',description:'台风中心风力，不代表你所在地区的风力。'},
 {number:'03',title:'持续关注官方消息',description:'风雨暂歇不代表风险解除。'},
];

export default function Home() {
 const [stormId,setStormId]=useState(storms[0].id);
 const [regionId,setRegionId]=useState(regions[0].id);
 const [selected,setSelected]=useState(CURRENT_INDEX);
 const [forecast,setForecast]=useState(true);
 const [playing,setPlaying]=useState(false);
 const [zoom,setZoom]=useState(1);
 const [view,setView]=useState<'map'|'table'>('map');
 const [dialog,setDialog]=useState<'about'|'warning'|AlertLevel|null>(null);
 const [activeNav,setActiveNav]=useState('overview');
 const storm=getStorm(stormId), region=getRegion(regionId);
 const current=storm.points[CURRENT_INDEX], point=storm.points[selected];
 const warning=region.level ? levels[region.level] : null;
 const visiblePoints=forecast?storm.points:storm.points.slice(0,CURRENT_INDEX+1);
 const [selectedX,selectedY]=projectPoint(point.lon,point.lat);
 const [centerX,centerY]=projectPoint(current.lon,current.lat);
 const [regionX,regionY]=projectPoint(region.lon,region.lat);
 const polyline=(items:typeof storm.points)=>items.map(p=>projectPoint(p.lon,p.lat).join(',')).join(' ');
 const vbWidth=960/zoom,vbHeight=580/zoom;
 const changePoint=(index:number)=>{setPlaying(false);setSelected(index);};
 function changeStorm(id:string) {setStormId(id);setSelected(CURRENT_INDEX);setPlaying(false);setZoom(1);}
 function toggleForecast(checked:boolean) {setForecast(checked);if(!checked&&selected>CURRENT_INDEX)setSelected(CURRENT_INDEX);setPlaying(false);}
 function startReplay(){if(playing){setPlaying(false);return;}if(selected>=CURRENT_INDEX)setSelected(0);setPlaying(true);}
 useEffect(()=>{
  if(!playing)return;
  const timer=setTimeout(()=>{
   setSelected(Math.min(CURRENT_INDEX,selected+1));
   if(selected>=CURRENT_INDEX-1)setPlaying(false);
  },1100);
  return ()=>clearTimeout(timer);
 },[playing,stormId,selected]);
 const dialogTitle=dialog==='about'?'关于这份演示':dialog==='warning'?(warning?'台风'+warning.name+'预警 · 演示详情':'未设置预警样例'):dialog?levels[dialog].name+'预警 · 颜色说明':'';
 return <>
  <a className="skip-link" href="#overview">跳到主要内容</a>
  <div className="demo-ribbon"><strong><Info size={13}/> 演示模式 · DEMO</strong><span>本页所有台风、轨迹及预警数据均为虚构示例，仅为演示使用，不用于防灾决策。</span></div>
  <header className="site-header">
   <a className="brand" href="#overview"><span className="brand-symbol"><Waves size={26}/></span><span><span className="brand-name">岸风</span><span className="brand-sub">COASTAL WATCH</span></span></a>
   <nav className="navigation" aria-label="主导航">
    {[{id:'overview',text:'实况总览',icon:LayoutDashboard},{id:'track',text:'台风路径',icon:Route},{id:'warnings',text:'预警中心',icon:Bell}].map(n=><a key={n.id} href={'#'+n.id} className={activeNav===n.id?'nav-active':''} onClick={()=>setActiveNav(n.id)}><n.icon size={16}/>{n.text}</a>)}
   </nav>
   <div className="header-end"><span className="demo-pill"><span className="tiny-dot"/>演示数据</span><Button variant="ghost" size="icon" className="icon-button" aria-label="数据来源与演示说明" onClick={()=>setDialog('about')}><CircleHelp size={19}/></Button></div>
  </header>
  <main className="page-shell" id="overview">
   <div className="page-heading"><div><div className="eyebrow">TYPHOON MONITOR</div><h1>台风实况总览 <span className="title-demo">演示版</span></h1><p className="heading-caption">看清台风动态，了解你所在地区的预警信息。</p></div>
    <div className="region-control"><span id="region-label">我的关注地区</span><Select value={regionId} onValueChange={v=>{if(v)setRegionId(v);}}><SelectTrigger className="region-select" aria-labelledby="region-label"><MapPin size={16}/><SelectValue>{region.label}</SelectValue></SelectTrigger><SelectContent align="end">{regions.map(r=><SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent></Select></div>
   </div>
   <section className="storm-bar" aria-label="演示台风选择">
    <div className="storm-tabs" role="group" aria-label="选择虚构台风">{storms.map(s=><Button key={s.id} className={'storm-tab '+(s.id===stormId?'selected':'')} variant="ghost" aria-pressed={s.id===stormId} onClick={()=>changeStorm(s.id)}><Waves size={20}/><span>{s.name}<small>{s.id}</small></span>{s.id===stormId&&<span className="tab-dot"/>}</Button>)}</div>
    <div className="snapshot-time"><Clock3 size={14}/><span>示例资料时间 <b>{DEMO_TIME}</b><small>北京时间 UTC+8 · 固定数据，非实时更新</small></span></div>
   </section>
   <section className="storm-summary" aria-label="台风名称">
    <div className="storm-name"><span className="storm-badge"><Waves size={28}/></span><div><h2>{storm.name}<span className="teal-tag">{storm.category}</span></h2><div className="storm-label">{storm.english} · {storm.id} · 虚构台风名称</div></div></div>
    <p className="storm-description"><Navigation size={15}/><span>模拟向<strong>{storm.direction}</strong>方向移动，速度约<strong>{storm.speed} 公里/小时</strong></span><span className="mini-demo">仅演示</span></p>
   </section>
   <div className="statistics">
    <section className="stat-card"><div className="stat-label"><MapPin size={16}/>中心位置</div><div className="stat-value coordinate">{current.lat.toFixed(1)}<small>°N</small><span className="coordinate-divider"/> {current.lon.toFixed(1)}<small>°E</small></div><div className="stat-foot">示例位置 · 西北太平洋洋面</div></section>
    <section className="stat-card"><div className="stat-label"><Navigation size={16}/>移动方向 / 速度</div><div className="stat-value direction">{storm.direction}<span className="direction-arrow">↖</span></div><div className="stat-foot"><strong>{storm.speed} km/h</strong><span className="foot-divider">/</span>移动速度，非风速</div></section>
    <section className="stat-card wind-stat"><div className="stat-label"><Wind size={16}/>中心附近最大风力</div><div className="stat-value">{current.level}<small>级</small><span className="wind-speed">{current.wind} <small>m/s</small></span></div><div className="stat-foot">不代表你所在地的风力</div></section>
    <section className="stat-card"><div className="stat-label"><Gauge size={16}/>中心最低气压</div><div className="stat-value">{current.pressure}<small>hPa</small></div><div className="stat-foot">本地固定演示数据 · 非实测</div></section>
   </div>
   <div className="workspace">
    <div className="main-column">
     <section className="panel track-panel" id="track" aria-labelledby="track-title">
      <div className="panel-top"><div><h2 id="track-title"><Route size={17}/>台风路径示意图</h2><p>查看台风走向，点击路径点了解示例详情</p></div><div className="view-switch" role="group" aria-label="路径展示方式"><Button variant="ghost" aria-pressed={view==='map'} onClick={()=>setView('map')} className={view==='map'?'active':''}><Map size={14}/><span>地图</span></Button><Button variant="ghost" aria-pressed={view==='table'} onClick={()=>setView('table')} className={view==='table'?'active':''}><List size={14}/><span>列表</span></Button></div></div>
      <div className="map-toolbar"><div className="map-key"><span><i className="legend-line"/>历史轨迹</span><span><i className="legend-line future"/>模拟预报</span><span><i className="current-key"/>当前演示点</span></div><label className="forecast-toggle" htmlFor="forecast-checkbox"><Checkbox id="forecast-checkbox" checked={forecast} onCheckedChange={toggleForecast} aria-label="显示模拟预报路径"/>显示模拟预报</label></div>
      {view==='map'?<div className="map-area">
       <div className="map-watermark">DEMO ONLY <span>路径仅为示意</span></div>
       <svg viewBox={[(960-vbWidth)/2,(580-vbHeight)/2,vbWidth,vbHeight].join(' ')} role="group" aria-label={storm.name+'演示轨迹，可点击路径点，或使用下方时间轴及列表'}>
        <defs><pattern id="ocean-grid" x="0" y="0" width="96" height="72.5" patternUnits="userSpaceOnUse"><path d="M96 0H0V72.5" fill="none" stroke="#d4e4e9" strokeWidth=".7"/></pattern><clipPath id="map-bounds"><rect width="960" height="580"/></clipPath><filter id="marker-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity=".12"/></filter></defs>
        <g clipPath="url(#map-bounds)"><rect width="960" height="580" fill="#e9f2f5"/><rect width="960" height="580" fill="url(#ocean-grid)"/>
         {landPaths.map((d,i)=><path key={i} d={d} fill="#f8faf9" stroke="#c7d6d9" strokeWidth="1.2" fillRule="evenodd"/>)}
         <text x="245" y="130" className="land-label">中 国</text><text x="65" y="295" className="province-label">广东</text><text x="205" y="231" className="province-label">福建</text><text x="272" y="124" className="province-label small-province">浙江</text>
         <text x="475" y="168" className="sea-label">东 海</text><text x="188" y="468" className="sea-label">南 海</text><text x="706" y="405" className="sea-label">西北太平洋</text><text x="355" y="329" className="island-label" transform="rotate(-65 355 329)">台湾岛</text>
         {[115,120,125,130,135].map(lon=><text key={lon} x={projectPoint(lon,15)[0]+5} y="567" className="grid-label">{lon}°E</text>)}
         {[20,25,30].map(lat=><text key={lat} x="928" y={projectPoint(136,lat)[1]-5} className="grid-label">{lat}°N</text>)}
         {cities.map(city=>{const [x,y]=projectPoint(city.lon,city.lat);return <g key={city.label}><circle cx={x} cy={y} r="2.7" fill="#829aa3"/><text x={x-9} y={y-9} textAnchor="end" className="city-label">{city.label}</text></g>;})}
         <g><circle cx={regionX} cy={regionY} r="7" fill="#087c83" fillOpacity=".14"/><circle cx={regionX} cy={regionY} r="3.7" fill="#087c83"/><rect x={regionX-28} y={regionY-52} width="84" height="26" rx="5" fill="white" stroke="#cddfe2"/><text x={regionX+14} y={regionY-35} textAnchor="middle" fill="#087c83" fontSize="10">关注 · {region.city.slice(0,-1)}</text></g>
         <polyline points={polyline(storm.points.slice(0,CURRENT_INDEX+1))} fill="none" stroke="#108c92" strokeWidth="3.5" strokeLinejoin="round"/>
         {forecast&&<polyline points={polyline(storm.points.slice(CURRENT_INDEX))} fill="none" stroke="#108c92" strokeWidth="2.5" strokeDasharray="7 7" strokeLinejoin="round"/>}
         {visiblePoints.map((p,i)=>{const [x,y]=projectPoint(p.lon,p.lat);return <g key={p.time} className="map-point" tabIndex={0} role="button" aria-label={pointLabel(i)+' '+p.time+'，'+p.level+'级'} aria-pressed={selected===i} onClick={()=>changePoint(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();changePoint(i);}}}><circle cx={x} cy={y} r="20" fill="transparent"/>{i===CURRENT_INDEX&&<circle cx={x} cy={y} r="21" fill="#e7a654" opacity=".18"/>}<circle cx={x} cy={y} r={i===CURRENT_INDEX?7:4.6} fill={i===CURRENT_INDEX?'#d99438':p.forecast?'#fff':'#108c92'} stroke={p.forecast?'#108c92':'#fff'} strokeWidth="2.4"/><title>{p.time+' · '+p.lat+'°N '+p.lon+'°E · '+p.wind+'m/s · 仅演示'}</title></g>;})}
         <circle cx={selectedX} cy={selectedY} r="13" fill="none" stroke="#087c83" strokeWidth="1.5" strokeDasharray={point.forecast?'3 3':undefined} pointerEvents="none"/>
         <g filter="url(#marker-shadow)" pointerEvents="none"><rect x={centerX+20} y={centerY-57} width="143" height="51" rx="7" fill="white" stroke="#dce8eb"/><text x={centerX+33} y={centerY-35} fontSize="13" fontWeight="650" fill="#244552">{storm.name} · {current.level}级</text><text x={centerX+33} y={centerY-18} fontSize="10" fill="#85979f">08/19 08:00 · 当前演示点</text></g>
        </g>
       </svg>
       <div className="map-controls"><Button size="icon" variant="outline" aria-label="放大路径图" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.2))}><Plus/></Button><Button size="icon" variant="outline" aria-label="缩小路径图" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.2))}><Minus/></Button><Button size="icon" variant="outline" aria-label="重置路径图视角" onClick={()=>setZoom(1)}><LocateFixed/></Button></div>
       <div className="map-attribution">示意图 · 非导航地图 <span>陆地轮廓：Natural Earth</span></div>
      </div>:<div className="track-table"><Table><caption className="sr-only">{storm.name}轨迹数据，均为虚构演示；时间为北京时间</caption><TableHeader><TableRow><TableHead>示例时间</TableHead><TableHead>类型</TableHead><TableHead>中心位置</TableHead><TableHead>风力 / 风速</TableHead><TableHead>查看</TableHead></TableRow></TableHeader><TableBody>{visiblePoints.map((p,i)=><TableRow key={p.time} data-state={selected===i?'selected':undefined}><TableCell>{p.time}</TableCell><TableCell><span className={'table-kind '+(p.forecast?'is-forecast':'')}>{pointLabel(i)}</span></TableCell><TableCell>{p.lat.toFixed(1)}°N / {p.lon.toFixed(1)}°E</TableCell><TableCell>{p.level}级 / {p.wind}m/s</TableCell><TableCell><Button variant="ghost" aria-label={'选择'+p.time+'演示轨迹点'} onClick={()=>changePoint(i)}>选择<ChevronRight size={14}/></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      <div className="point-detail" aria-live="polite" aria-atomic="true"><div><span className={'point-kind '+(point.forecast?'forecast-kind':'')}>{pointLabel(selected)}</span><strong>{point.time}</strong><span className="point-timezone">北京时间</span></div><span>{point.lat.toFixed(1)}°N / {point.lon.toFixed(1)}°E</span><span>中心风力 <b>{point.level}级</b> · {point.wind} m/s</span></div>
      <div className="timeline"><Button variant="outline" size="icon" className="play-button" onClick={startReplay} aria-label={playing?'暂停历史轨迹回放':'播放历史轨迹回放'}>{playing?<Pause size={15}/>:<Play size={15}/>}</Button><div className="timeline-inner"><span id="timeline-label" className="sr-only">选择演示路径时间点</span><Slider min={0} max={visiblePoints.length-1} step={1} value={[selected]} aria-labelledby="timeline-label" onValueChange={value=>changePoint(Array.isArray(value)?value[0]:value)}/><div className="timeline-ticks"><span>08/18 08:00</span><span>当前演示 · 08/19 08:00</span>{forecast&&<span>08/20 20:00</span>}</div></div><Button variant="ghost" size="icon" className="reset-point" aria-label="返回当前演示点" onClick={()=>changePoint(CURRENT_INDEX)}><RotateCcw size={15}/></Button></div>
      <p className="track-disclaimer"><Info size={12}/>回放只改变路径选中点，上方数据面板始终显示当前演示快照。虚线路径不是真实预报。</p>
     </section>
     <section className="panel outlook-panel" aria-labelledby="outlook-title"><div className="panel-top"><div><h2 id="outlook-title">接下来，往哪里走？</h2><p>示例起报时间：2026-08-19 08:00 · 以下为固定模拟预报</p></div><span className="demo-pill">非真实预报</span></div><div className="outlook-grid">{[5,6,7].map((index,i)=>{const p=storm.points[index];return <Button variant="ghost" className={'outlook-item '+(selected===index?'is-selected':'')} key={p.time} onClick={()=>{setForecast(true);changePoint(index);}}><span className="outlook-horizon">+{[6,12,24][i]} 小时 <ArrowUpRight size={15}/></span><strong>{p.lat.toFixed(1)}°N <small>/</small> {p.lon.toFixed(1)}°E</strong><span>{p.time} <i/> 中心风力 {p.level}级</span></Button>;})}</div></section>
    </div>
    <aside className="side-column">
     <section className="panel warning-panel" id="warnings" aria-labelledby="warning-title">
      <div className="panel-top"><div><h2 id="warning-title"><Bell size={17}/>我的地区预警</h2><p>{region.city} · {region.district}</p></div><span className="demo-pill">演示</span></div>
      {warning?<div className={'warning-body level-'+region.level}><div className="warning-top"><span className="warning-icon"><Wind size={24}/></span><span className="warning-demo">模拟预警</span></div><h3>台风{warning.name}预警</h3><p className="warning-action">{warning.label} <span>· 视觉示例</span></p><div className="warning-meta"><Clock3 size={12}/>模拟时间 08月19日 08:00</div><p className="warning-copy">仅展示预警样式，不代表{region.city}当前存在该预警。</p><Button className="warning-button" variant="ghost" onClick={()=>setDialog('warning')}>查看演示详情 <ArrowRight size={15}/></Button></div>:<div className="warning-body no-warning"><CircleHelp size={26}/><h3>未设置预警样例</h3><p>此地区没有配置演示预警。未接入真实预警数据，不代表当地无预警或安全。</p><Button variant="outline" className="ui-button" onClick={()=>setDialog('about')}>了解数据状态</Button></div>}
      <div className="warning-source"><span className="source-dot"/>数据来源：本地演示数据集<span>非气象台发布</span></div>
      <div className="warning-guide"><div className="small-heading">预警颜色说明 <span>点击了解</span></div><div className="level-scale">{(Object.keys(levels) as AlertLevel[]).map(level=><Button key={level} variant="ghost" className={'level-button level-'+level} onClick={()=>setDialog(level)} aria-label={'了解'+levels[level].name+'预警颜色示例'}><i/>{levels[level].name}</Button>)}</div><p>地区规则可能不同，实际等级以当地官方发布为准。</p></div>
     </section>
     <section className="panel awareness-panel"><div className="panel-top"><h2><ShieldCheck size={18}/>给沿海居民的小提醒</h2></div><div className="guide-list">{guides.map(g=><div className="guide-item" key={g.number}><span>{g.number}</span><div><h3>{g.title}</h3><p>{g.description}</p></div></div>)}</div><a className="official-link" href="https://www.nmc.cn/f/alarm.html" target="_blank" rel="noopener noreferrer">前往官方预警查询 <ExternalLink size={14}/></a></section>
     <div className="data-note"><Info size={15}/><p>当前为产品演示，未连接实况接口，也不会发送预警通知。真实台风信息请通过官方渠道获取。</p></div>
    </aside>
   </div>
   <footer className="page-footer"><span><Waves size={14}/> 岸风 COASTAL WATCH <i/> 沿海居民台风信息站</span><div><Button variant="ghost" className="footer-button" onClick={()=>setDialog('about')}>数据与使用说明</Button><span>所有数据仅为演示使用</span></div></footer>
  </main>
  <Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null);}}><DialogContent className="info-dialog"><DialogHeader><span className="demo-pill dialog-demo">仅演示使用 · DEMO</span><DialogTitle>{dialogTitle}</DialogTitle><DialogDescription>{DEMO_NOTICE}</DialogDescription></DialogHeader>
   {dialog==='about'?<div className="dialog-body"><h3>这不是实时气象服务</h3><p>“青岚”和“云汐”为虚构台风，编号、位置、风力、路径、未来点位以及各地区预警均为本地固定演示数据。示例资料时间固定为 {DEMO_TIME}（北京时间），不会随网页刷新而更新。</p><h3>你可以体验什么？</h3><p>切换两组演示台风、切换关注地区、点击路径点、播放历史轨迹、开关模拟预报，或通过数据列表读取完整轨迹。上方实况面板不会跟随回放伪装成新的实时数据。</p><h3>来源与限制</h3><p>底图轮廓使用 Natural Earth 公有领域数据，仅为路径示意，无导航用途。本站不请求精确定位，不采集个人信息，不连接真实气象接口。</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">查看 Natural Earth 数据说明 <ExternalLink size={13}/></a><p>本演示没有官方预警发布权，不能作为出行、出海、停工停课或避险依据。</p></div>:dialog==='warning'?<div className="dialog-body"><div className={'dialog-warning level-'+region.level}><Wind size={26}/><strong>{warning?'台风'+warning.name+'预警':'未设置预警样例'}</strong><span>虚构样例 · 非官方</span></div><dl><div><dt>演示地区</dt><dd>{region.label}</dd></div><div><dt>数据来源</dt><dd>本地演示数据集（没有官方发布机构）</dd></div><div><dt>模拟发布时间</dt><dd>{DEMO_TIME} · UTC+8</dd></div><div><dt>状态</dt><dd>样式演示，不表示真实预警生效</dd></div></dl><p>该卡片只用于演示分级预警的排版及交互，不代表{region.city}的现实天气情况。正式版本需要接入当地官方预警原文、有效期、更新与解除消息。</p><p>防御指南应以当地气象及应急部门原文为准，本卡片不发布应急指令。</p></div>:dialog?<div className="dialog-body"><div className={'dialog-warning level-'+dialog}><Wind size={26}/><strong>{levels[dialog].name}预警</strong><span>{levels[dialog].label}</span></div><p>{levels[dialog].meaning}</p><p>这里展示颜色与阅读层级，不是预警触发标准。不同地区可能使用不同规则或额外等级；不能根据台风中心风力或距离自行推算你所在地的预警颜色。</p></div>:null}
   <a className="official-link dialog-official" href="https://www.nmc.cn/f/alarm.html" target="_blank" rel="noopener noreferrer">查看真实官方预警 <ExternalLink size={14}/></a>
  </DialogContent></Dialog>
 </>;
}
