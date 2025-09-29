
import React from 'react'
import clsx from 'clsx'

type Conv = { _id: string, name: string, deleted?: boolean, agent_id: string, user_id: string,  }
type Agent = { _id: string, name: string, description: object, agent_config: object, created_on?: string }

export default function Sidebar({ conversations, activeId, agents, onSelectConv, onStartWithAgent }: {
  conversations: Conv[],
  activeId?: string,
  agents: Agent[],
  onSelectConv: (id:string)=>void,
  onNewConv: ()=>void,
  onStartWithAgent: (agentId:string)=>void
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="text-xl font-bold text-weatherGreen">WeatherWalay</div>
        <div className="text-sm text-weatherMuted">Chats & Agents</div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-3">
        <div>
          <div className="text-sm font-semibold mb-2">Conversations</div>
          {conversations.map(c => (
            <div key={c._id} onClick={()=>onSelectConv(c._id)} className={clsx('p-3 rounded-md mb-2 cursor-pointer', activeId===c._id ? 'bg-green-50 border-l-4 border-weatherGreen':'hover:bg-gray-50')}>
              <div className="font-semibold">{c.name}</div>
              {/* <div className="text-xs text-weatherMuted truncate">{c.lastMessage||''}</div> */}
            </div>
          ))}
          {conversations.length===0 && <div className="text-sm text-weatherMuted">No conversations yet</div>}
        </div>

        <div className="pt-3 border-t">
          <div className="text-sm font-semibold mb-2">Agents</div>
          {agents.map(a => (
            <div key={a._id} className="p-3 rounded-md mb-2 bg-white border">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-weatherMuted">Agent ID: {a._id}</div>
                </div>
                <div>
                  <button onClick={()=>onStartWithAgent(a._id)} className="bg-weatherGreen text-white px-3 py-1 rounded-md">Chat</button>
                </div>
              </div>
            </div>
          ))}
          {agents.length===0 && <div className="text-sm text-weatherMuted">No agents</div>}
        </div>
      </div>

      <div className="p-3 border-t text-xs text-weatherMuted">
        Token is fetched from /api/auth/token — all requests include Authorization & AUTH_STRATEGY headers.
      </div>
    </div>
  )
}
