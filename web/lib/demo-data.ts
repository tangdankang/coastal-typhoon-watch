/** Entire dataset is fictional. Never label it as official or live weather. */
export const DEMO_NOTICE = '所有台风、轨迹及预警数据仅为演示使用，不用于防灾决策。';
export const DEMO_TIME = '2026-08-19 08:00';
export const CURRENT_INDEX = 4;
export type TrackPoint = { time: string; lon: number; lat: number; wind: number; level: number; pressure: number; forecast: boolean };
export type DemoStorm = { id: string; name: string; english: string; category: string; direction: string; speed: number; points: TrackPoint[] };
const times = ['08-18 08:00','08-18 14:00','08-18 20:00','08-19 02:00','08-19 08:00','08-19 14:00','08-19 20:00','08-20 08:00','08-20 20:00'];
function track(rows: number[][]): TrackPoint[] {
 return rows.map(([lon,lat,wind,level,pressure],i)=>({time:times[i],lon,lat,wind,level,pressure,forecast:i>CURRENT_INDEX}));
}
export const storms: DemoStorm[] = [
 {id:'DEMO-01',name:'青岚',english:'QINGLAN',category:'台风级',direction:'西北',speed:18,points:track([
  [130.8,18.6,28,10,985],[129.6,19.4,30,11,980],[128.3,20.3,33,12,975],[126.9,21.4,38,13,970],[125.4,22.6,40,13,965],
  [124.5,23.9,42,14,960],[123.4,25.2,40,13,965],[122.4,27.0,35,12,975],[121.8,29.0,28,10,985]
 ])},
 {id:'DEMO-02',name:'云汐',english:'YUNXI',category:'强热带风暴级',direction:'西北偏西',speed:12,points:track([
  [134.8,16.1,18,8,1000],[133.9,16.5,20,8,996],[132.9,17.0,23,9,992],[131.8,17.7,25,10,988],[130.8,18.4,28,10,985],
  [129.8,19.0,30,11,982],[128.7,19.8,33,12,977],[127.1,21.1,35,12,972],[125.8,22.8,33,12,978]
 ])},
];
export type AlertLevel = 'blue'|'yellow'|'orange'|'red';
export const levels: Record<AlertLevel,{name:string;label:string;meaning:string}> = {
 blue:{name:'蓝色',label:'关注动态',meaning:'颜色展示示例：关注台风动态，了解本地官方通知。'},
 yellow:{name:'黄色',label:'做好准备',meaning:'颜色展示示例：查看本地官方防御指南，提前做好准备。'},
 orange:{name:'橙色',label:'加强防护',meaning:'颜色展示示例：优先查看当地气象及应急部门最新要求。'},
 red:{name:'红色',label:'紧急防御',meaning:'颜色展示示例：完整阅读并遵循当地官方防御及应急安排。'},
};
export type DemoRegion = { id:string; label:string; province:string; city:string; district:string; level:AlertLevel|null; lon:number; lat:number; };
export const regions: DemoRegion[] = [
 {id:'ningbo',label:'浙江 · 宁波市 · 鄞州区',province:'浙江省',city:'宁波市',district:'鄞州区',level:'yellow',lon:121.55,lat:29.87},
 {id:'fuzhou',label:'福建 · 福州市 · 长乐区',province:'福建省',city:'福州市',district:'长乐区',level:'orange',lon:119.52,lat:25.96},
 {id:'zhoushan',label:'浙江 · 舟山市 · 定海区',province:'浙江省',city:'舟山市',district:'定海区',level:'red',lon:122.11,lat:30.02},
 {id:'xiamen',label:'福建 · 厦门市 · 思明区',province:'福建省',city:'厦门市',district:'思明区',level:'blue',lon:118.08,lat:24.45},
 {id:'shenzhen',label:'广东 · 深圳市 · 盐田区',province:'广东省',city:'深圳市',district:'盐田区',level:null,lon:114.24,lat:22.56},
];
export function projectPoint(lon:number,lat:number):[number,number] { return [(lon-112)/25*960,(35-lat)/20*580]; }
export function pointLabel(index:number):string {return index>CURRENT_INDEX?'模拟预报':index===CURRENT_INDEX?'当前演示点':'历史演示点';}
export function getRegion(id:string):DemoRegion {return regions.find(r=>r.id===id)??regions[0];}
export function getStorm(id:string):DemoStorm {return storms.find(s=>s.id===id)??storms[0];}
