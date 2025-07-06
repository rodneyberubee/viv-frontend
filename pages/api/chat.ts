// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        temperature: 0.8,
      }),
    });

    const json = await openaiRes.json();
    const reply = json.choices?.[0]?.message?.content ?? 'Something went wrong.';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[ERROR] Chat API failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
