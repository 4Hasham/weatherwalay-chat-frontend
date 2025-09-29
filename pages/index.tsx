
import { useEffect, useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { connectSocket } from '../lib/socket'
import axios from 'axios'

type Conv = { _id: string, name: string, deleted?: boolean, agent_id: string, user_id: string  }
type Agent = { _id: string, name: string, description: object, agent_config: object, created_on?: string }

export default function Home() {
  const [conversations, setConversations] = useState<Conv[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [active, setActive] = useState<string|undefined>(undefined)
  const [messages, setMessages] = useState<{_id?:string, sender:'user'|'agent', content:string, sender_id: string, chat_id: string, deleted?:boolean}[]>([])
  const [token, setToken] = useState<string|undefined>(undefined)
  const [user, setUser] = useState<string|undefined>(undefined);
  const [strategy, setStrategy] = useState<string>('default')
  const socketRef = useRef<any>(null)
  const activeRef = useRef<string | undefined>();

  useEffect(() => {
    (async () => {
      // fetch token from frontend API route (mock or proxy to real auth)
      const t = await axios.get("/api/auth/token");
      setToken(t.data.token);
      setStrategy(t.data.strategy);

      // fetch user
      const userRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth`,
        {
          headers: {
            Authorization: t.data.token,
            "X-AUTH-STRATEGY": t.data.strategy,
          },
          withCredentials: true,
        }
      );
      setUser(userRes.data.record);

      // load chats & agents
      const [cRes, aRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
          headers: {
            Authorization: t.data.token,
            "X-AUTH-STRATEGY": t.data.strategy,
          },
          withCredentials: true,
        }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agent`, {
          headers: {
            Authorization: t.data.token,
            "X-AUTH-STRATEGY": t.data.strategy,
          },
          withCredentials: true,
        }),
      ]);

      setAgents(aRes.data.record || []);
      setConversations(cRes.data.record || []);
      // set last chat as active
      const lastChat = cRes.data.record.length > 0 ? cRes.data.record[cRes.data.record.length - 1] : undefined;
      if (lastChat) {
        setActive(lastChat._id);
        let messages = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${lastChat._id}/message?direction=-1&limit=50`, {
          headers: {
            Authorization: t.data.token,
            "X-AUTH-STRATEGY": t.data.strategy,
          },
          withCredentials: true,
        });
        setMessages(messages.data.record || []);
      }
    })();
  }, []); // run once on mount

  useEffect(() => { 
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!token || !strategy) return;

    // connect socket
    const sock = connectSocket(
      token.split(" ")[1],
      strategy,
      process.env.NEXT_PUBLIC_DOMAIN_URL || ""
    );
    socketRef.current = sock;

    sock.on("connect", () =>
      console.log("✅ socket connected", sock.id)
    );

    sock.on("chat:message", (payload: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === payload.chat_id
            ? { ...c, lastMessage: payload.content }
            : c
        )
      );
    });

    sock.on("messageRemoved", (payload: any) => {
      if (payload.chat_id === activeRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === payload._id ? { ...msg, deleted: true } : msg
          )
        );
      }
    });

    sock.on("chat:agentDone", (payload: any) => {
      if (payload.chat_id === activeRef.current) {
        setMessages((m) => [
          ...m,
          {
            _id: payload._id,
            sender: "agent",
            sender_id: payload.sender_id,
            chat_id: payload.chat_id,
            content: payload.content,
          },
        ]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === payload.chat_id
            ? { ...c, lastMessage: payload.content }
            : c
        )
      );
    });

    return () => {
      sock.disconnect();
      console.log("❌ socket disconnected");
    };
  }, [token, strategy]); // only re-run when auth context changes

  async function createNew(){
    const title = `Chat - ${process.env.NEXT_PUBLIC_DEFAULT_AGENT_ID}`;
    if (!token) return;
    const resp = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat`, { agent_id: process.env.NEXT_PUBLIC_DEFAULT_AGENT_ID, name: title }, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    // refresh list
    const list = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat`, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    setConversations(list.data.record || []);
    setActive(resp.data.record._id || list.data.record[0]?._id);
    setMessages([]);
  }

  async function startWithAgent(agentId:string){
    if (!token) return;
    const resp = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat`, { agent_id: agentId, name: `Chat — ${agentId}` }, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    const list = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat`, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    setConversations(list.data.record || []);
    setActive(resp.data.record.id);
    setMessages([]);
  }

  async function selectConv(id:string){
    if (!token) return;
    setActive(id);
    const r = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat/${id}/message`, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    // expect r.data.messages
    setMessages(r.data.record || []);
  }

  async function sendMessage(text:string){
    if (!token || !activeRef.current) return;
    // optimistic UI
    setMessages(m=>[...m, { sender:'user', content: text, chat_id: activeRef.current, sender_id: user }]);
    await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat/${activeRef.current}/message`, { message: text }, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    // server will emit via socket and append agent responses; we still update lastMessage in conversations
    setConversations(prev => prev.map(c => c._id === activeRef.current ? { ...c, lastMessage: text } : c));
  }

  async function deleteMessage(messageId:string){
    if (!token || !active) return;
    await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/chat/${active}/message/${messageId}`, { headers: { Authorization: token, "X-AUTH-STRATEGY": strategy }, withCredentials: true });
    // optimistic update - actual delete will be reflected via socket event message:delete
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true } : m));
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6">
        <div className="col-span-1 h-[82vh] bg-white rounded-xl shadow p-0">
          <Sidebar conversations={conversations} activeId={activeRef.current} agents={agents} onSelectConv={selectConv} onNewConv={createNew} onStartWithAgent={startWithAgent} />
        </div>
        <div className="col-span-3 h-[82vh] bg-white rounded-xl shadow p-0 flex flex-col">
          <div className="p-4 border-b">
            <div className="text-lg font-bold text-weatherGreen">{conversations.find(c=>c._id===activeRef.current)?.name || 'Chat'}</div>
            <div className="text-sm text-weatherMuted">{conversations.find(c=>c._id===activeRef.current)?.agent_id ? `Agent: ${conversations.find(c=>c._id===activeRef.current)?.agent_id}` : 'Conversation'}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ChatWindow messages={messages} onSend={sendMessage} onDelete={deleteMessage} />
          </div>
        </div>
      </div>
    </div>
  )
}
