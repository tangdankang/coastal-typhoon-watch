import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title:'岸风 · 台风实况与预警 | 仅演示使用',
 description:'面向沿海居民的台风信息演示网页。台风、路径与预警均为虚构示例，不用于防灾决策。',
 robots:{index:false,follow:false},
 metadataBase:new URL('https://coastal-watch-demo.f378402801.chatgpt.site'),
 openGraph:{title:'岸风 · 台风信息演示',description:'所有台风、路径与预警数据仅为演示使用，不用于防灾决策。',type:'website',locale:'zh_CN',images:[{url:'/og.png',width:1536,height:1024,alt:'岸风 · 台风动态，一目了然 · 仅演示使用'}]},
 twitter:{card:'summary_large_image',title:'岸风 · 台风信息演示',description:'所有数据仅为演示使用，不用于防灾决策。',images:['/og.png']},
};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
 return <html lang="zh-CN"><body>{children}</body></html>;
}
