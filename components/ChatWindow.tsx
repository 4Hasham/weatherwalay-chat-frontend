
import React, { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ messages, onSend, onDelete }: { messages:{id?:string, sender_id: string, sender:'user'|'agent', chat_id: string, content:string, deleted?:boolean}[], onSend:(text:string)=>void, onDelete:(messageId:string)=>void }) {
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(()=>{ if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-3" ref={ref}>
        {messages.map((m,i)=>(
          <div key={m.id || i} className="relative">
            <MessageBubble from={m.sender} text={m.content} deleted={m.deleted} />
            {!m.deleted && m.sender==='user' && m.id && (
              <button title="Delete" onClick={()=>onDelete(m.id!)} className="absolute right-0 top-0 text-xs text-weatherMuted">🗑</button>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <input id="chat-input" className="flex-1 border rounded-md px-3 py-2" placeholder="Type a message..." onKeyDown={(e:any)=>{ if (e.key==='Enter') { const val=e.target.value; if(val.trim()){ onSend(val.trim()); e.target.value=''; } } }} />
        <button onClick={()=>{ const el=document.getElementById('chat-input') as HTMLInputElement; const val=el.value; if(val.trim()){ onSend(val.trim()); el.value=''; } }} className="bg-weatherGreen text-white px-4 rounded-md">Send</button>
      </div>
    </div>
  )
}
