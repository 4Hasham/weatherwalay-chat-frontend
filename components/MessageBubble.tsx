
import React from 'react'

export default function MessageBubble({ from, text, deleted }: { from:'user'|'agent', text:string, deleted?:boolean }) {
  if (deleted) {
    return <div className="text-xs text-weatherMuted italic">Message deleted</div>
  }

  if (from==='user') {
    return <div className="flex justify-end"><div className="bg-weatherGreen text-white px-4 py-2 rounded-lg max-w-[70%]">{text}</div></div>
  }
  return <div className="flex justify-start"><div className="bg-white border px-4 py-2 rounded-lg max-w-[70%]">{text}</div></div>
}
