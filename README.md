
# WeatherWalay — Next.js Frontend (Final)

This frontend is built to work with your existing NestJS backend (assumed on localhost). It implements:
- Conversations sidebar + Agents list
- Create chat (POST /chat), list chats (GET /chat), get chat (GET /chat/:chatId)
- Send message (POST /chat/:chatId/message), delete message (DELETE ...)
- WebSocket integration with namespace /chats (handles message:new, message:delete, agent:response)
- All API calls attach Authorization and AUTH_STRATEGY headers and use withCredentials to capture cookies set by backend.

## Environment
Set NEXT_PUBLIC_BACKEND_URL to your backend, e.g. http://localhost:3000

## Run locally
1. npm install
2. npm run dev
3. Open http://localhost:3000
