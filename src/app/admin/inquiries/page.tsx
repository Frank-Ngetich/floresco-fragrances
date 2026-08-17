'use client';
import { useState } from 'react';
import { MessageSquare, X, Mail } from 'lucide-react';
const MOCK=[
  {id:'1',name:'Elizabeth Njeri',email:'e.njeri@gmail.com', subject:'Product availability', message:'Do you stock Baccarat Rouge 540?',status:'new',time:'2h ago'},
  {id:'2',name:'Michael Ochieng',email:'m.ochieng@yahoo.com',subject:'Wedding gift advice',  message:'Need a fragrance gift for my wife. Budget KES 15,000.',status:'new',time:'5h ago'},
  {id:'3',name:'Faith Wambui',   email:'f.wambui@gmail.com',subject:'Stock query',           message:'Is the 100ml Rose Damascena available?',status:'replied',time:'1d ago'},
];
const SB:Record<string,string>={new:'bg-amber-500/15 text-amber-300',replied:'bg-blue-500/15 text-blue-300',closed:'bg-white/10 text-white/40'};
export default function AdminInquiries() {
  const [sel,setSel]=useState<typeof MOCK[0]|null>(null);
  const [reply,setReply]=useState('');
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display">Inquiries</h1><p className="text-white/50 text-sm mt-1">{MOCK.filter(m=>m.status==='new').length} new messages</p></div>
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-2">
          {MOCK.map(inq=>(
            <div key={inq.id} onClick={()=>setSel(inq)} className={`bg-white/[0.04] border rounded-lg p-4 cursor-pointer transition-all hover:bg-white/[0.07] ${sel?.id===inq.id?'border-wine-500/50':'border-white/10'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-wine-700 flex items-center justify-center text-white text-xs flex-shrink-0">{inq.name.charAt(0)}</div><div><div className="text-sm text-white font-medium">{inq.name}</div><div className="text-xs text-white/40">{inq.email}</div></div></div>
                <span className={`text-[0.6rem] tracking-wide uppercase px-2 py-0.5 rounded-full ${SB[inq.status]}`}>{inq.status}</span>
              </div>
              <div className="text-xs text-white/55 font-medium mb-1">{inq.subject}</div>
              <div className="text-xs text-white/35 line-clamp-1">{inq.message}</div>
            </div>
          ))}
        </div>
        {sel&&(
          <div className="bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden flex flex-col self-start sticky top-24">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between"><span className="text-sm font-medium text-white">{sel.name}</span><button onClick={()=>setSel(null)} className="text-white/30 hover:text-white"><X size={16}/></button></div>
            <div className="p-5 space-y-4">
              <div><div className="text-[0.58rem] tracking-wide uppercase text-white/30 mb-1">From</div><div className="text-sm text-white/70">{sel.email}</div></div>
              <div><div className="text-[0.58rem] tracking-wide uppercase text-white/30 mb-1">Subject</div><div className="text-sm text-white">{sel.subject}</div></div>
              <div><div className="text-[0.58rem] tracking-wide uppercase text-white/30 mb-1">Message</div><div className="text-sm text-white/65 leading-relaxed">{sel.message}</div></div>
              <div className="border-t border-white/10 pt-4">
                <div className="text-[0.58rem] tracking-wide uppercase text-white/30 mb-2">Reply</div>
                <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4} placeholder="Type your reply…" className="w-full bg-white/[0.06] border border-white/15 text-white text-sm px-3 py-2.5 rounded resize-none focus:outline-none placeholder:text-white/30 mb-3"/>
                <button className="w-full flex items-center justify-center gap-2 bg-wine-600 hover:bg-wine-700 text-white text-xs uppercase tracking-wide py-2.5 rounded transition-colors"><Mail size={13}/>Send Reply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}