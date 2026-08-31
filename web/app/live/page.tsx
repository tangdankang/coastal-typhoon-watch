import LiveDashboard from '@/components/live-dashboard';
export const metadata = {
 title: '岸风 · 台风实况与路径',
 description: '浙江公开台风数据，每小时同步。非官方信息汇总，不替代官方预警。',
 openGraph: { title: '岸风 · 台风实况与路径', description: '公开数据 · 每小时同步', images: ['https://tangdankang.github.io/coastal-typhoon-watch/og-live.png'] },
 twitter: { card: 'summary_large_image', title: '岸风 · 台风实况与路径', description: '公开数据 · 每小时同步', images: ['https://tangdankang.github.io/coastal-typhoon-watch/og-live.png'] },
};
export default function LivePage() { return <LiveDashboard snapshotUrl="/data/current.json" />; }
