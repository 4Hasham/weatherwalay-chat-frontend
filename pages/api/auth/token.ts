
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mock token; replace with real auth integration.
  res.status(200).json({ token: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`, strategy: process.env.NEXT_PUBLIC_AUTH_STRATEGY });
}
