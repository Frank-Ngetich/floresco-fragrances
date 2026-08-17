'use client';
import { useState } from 'react';
import { Search, Users, Mail, Phone } from 'lucide-react';
import { formatKES } from '@/lib/utils';
const MOCK = [
  {id:'1',name:'Amina Kiptoo', email:'amina.k@gmail.com', phone:'0712345678',orders:3,total:56200,last:'Jul 18'},
  {id:'2',name:'James Otieno', email:'j.otieno@yahoo.com',phone:'0723456789',orders:1,total:16800,last:'Jul 20'},
  {id:'3',name:'Sarah Wanjiru',email:'sarah.w@gmail.com', phone:'0734567890',orders:5,total:98400,last:'Jul 20'},
  {id:'4',name:'David Kimani', email:'d.kimani@gmail.com',phone:'0745678901',orders:2,total:21000,last:'Jul 19'},
  {id:'5',name:'Grace Mutua',  email:'g.mutua@gmail.com', phone:'0756789012',orders:4,total:72300,last:'Jul 18'},
];
export default function AdminCustomers() {
  const [q,setQ]=useState('');
  const filtered=MOCK.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase())||c.email.includes(q));
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display">Customers</h1><p className="text-white/50 text-sm mt-1">{MOCK.length} registered customers</p></div>
      <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or email…" className="w-full bg-white/[0.06] border border-white/15 text-white text-sm pl-9 pr-4 py-2.5 placeholder:text-white/30 focus:outline-none rounded"/></div>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead><tr className="border-b border-white/10">{['Customer','Contact','Orders','Spent','Last Order'].map(h=><th key={h} className="text-left px-5 py-3 text-[0.6rem] tracking-[0.18em] uppercase text-white/35 font-medium">{h}</th>)}</tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-wine-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.name.charAt(0)}</div><span className="text-sm text-white">{c.name}</span></div></td>
              <td className="px-5 py-4"><div className="text-xs text-white/55 flex items-center gap-1.5"><Mail size={11}/>{c.email}</div><div className="text-xs text-white/35 flex items-center gap-1.5 mt-1"><Phone size={11}/>{c.phone}</div></td>
              <td className="px-5 py-4 text-sm text-white">{c.orders}</td>
              <td className="px-5 py-4 text-sm font-display text-white">{formatKES(c.total)}</td>
              <td className="px-5 py-4 text-xs text-white/40">{c.last}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>{filtered.length===0&&<div className="text-center py-14 text-white/30"><Users size={32} strokeWidth={1} className="mx-auto mb-3"/><p className="text-sm">No customers found</p></div>}</div>
    </div>
  );
}