
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token?: string, strategy?: string, backendUrl?: string) {
  if (socket) return socket;
  const url = backendUrl || (process.env.NEXT_PUBLIC_DOMAIN_URL || '');
  socket = io(url + '/chats', { auth: { token: token || '', strategy: strategy || '' }, withCredentials: true, reconnection: true });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
