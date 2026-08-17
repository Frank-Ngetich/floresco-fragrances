'use client';
import { BarChart2, TrendingUp, Users, ShoppingBag } from 'lucide-react';
export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display">Analytics</h1><p className="text-white/50 text-sm mt-1">Revenue, traffic and conversion</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Monthly Revenue',value:'KES 892,400',sub:'+23%',icon:TrendingUp,c:'text-green-400'},{label:'Total Orders',value:'127',sub:'This month',icon:ShoppingBag,c:'text-blue-400'},{label:'Customers',value:'94',sub:'New this month',icon:Users,c:'text-purple-400'},{label:'Avg Order',value:'KES 14,800',sub:'+8%',icon:BarChart2,c:'text-amber-400'}].map(s=>(
          <div key={s.label} className="bg-white/[0.04] border border-white/10 rounded-lg p-5">
            <div className="flex items-start justify-between mb-3"><span className="text-[0.6rem] tracking-[0.14em] uppercase text-white/40 leading-snug">{s.label}</span><s.icon size={16} className={s.c} strokeWidth={1.8}/></div>
            <div className="text-2xl font-display text-white mb-1">{s.value}</div>
            <div className="text-xs text-white/40">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg p-10 text-center">
        <BarChart2 size={40} strokeWidth={1} className="mx-auto text-white/20 mb-4"/>
        <p className="text-white/40 text-sm">Connect Google Analytics or Vercel Analytics for detailed charts.</p>
        <p className="text-white/25 text-xs mt-2">Set NEXT_PUBLIC_GA_ID in your environment variables.</p>
      </div>
    </div>
  );
}