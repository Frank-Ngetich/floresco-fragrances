'use client';
import Link from 'next/link';
import { Plus, Edit2, Eye } from 'lucide-react';
const POSTS = [
  { slug:'how-to-spot-fake-perfume', title:'How to Spot a Fake Perfume', date:'Jul 18, 2026', published:true },
  { slug:'best-oud-perfumes-kenya',  title:"Beginner's Guide to Oud",    date:'Jul 12, 2026', published:true },
  { slug:'edp-vs-edt-explained',     title:'EDP vs EDT vs Parfum',       date:'Jul 5, 2026',  published:true },
  { slug:'perfume-gift-guide',       title:'Perfume Gift Guide',          date:'Jun 28, 2026', published:false },
];
export default function AdminBlog() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-display">Blog / Journal</h1><p className="text-white/50 text-sm mt-1">{POSTS.length} articles</p></div>
        <button className="inline-flex items-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs tracking-[0.14em] uppercase font-medium px-5 py-2.5 rounded transition-colors"><Plus size={14}/>New Article</button>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead><tr className="border-b border-white/10">{['Title','Date','Status',''].map(h=><th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/35 font-medium">{h}</th>)}</tr></thead>
            <tbody>{POSTS.map(p=>(
              <tr key={p.slug} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4 text-sm text-white font-medium">{p.title}</td>
                <td className="px-5 py-4 text-xs text-white/50">{p.date}</td>
                <td className="px-5 py-4"><span className={`text-[0.62rem] tracking-wide uppercase px-2.5 py-1 rounded-full ${p.published?'bg-green-500/15 text-green-300':'bg-amber-500/15 text-amber-300'}`}>{p.published?'Published':'Draft'}</span></td>
                <td className="px-5 py-4"><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Link href={`/blog/${p.slug}`} target="_blank" className="p-1.5 text-white/40 hover:text-white transition-colors"><Eye size={14}/></Link><button className="p-1.5 text-white/40 hover:text-wine-300 transition-colors"><Edit2 size={14}/></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}