// pages/api/askViv.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userMessage, restaurantId } = req.body;

  if (!userMessage || !restaurantId) {
    return res.status(400).json({ error: 'Missing userMessage or restaurantId' });
  }

  try {
    const systemPrompt = `
You are Viv, a warm, helpful AI assistant for a restaurant called Molly's Cafe.
You respond like a real person. You can answer questions, hold conversation, or take a reservation if the user provides details.
Only if they clearly request a booking should you ask for time/date/party size. Never assume unless they give that info.
Be casual, natural, and kind.

Current restaurant ID: ${restaurantId}
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: userMessage.role, content: userMessage.content }
        ],
        temperature: 0.8
      })
    });

    const data = await openaiResponse.json();
    const reply = data?.choices?.[0]?.message?.content || '[Viv is speechless 😶]';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[askViv.ts error]', error);
    return res.status(500).json({ error: 'Viv crashed trying to think. Try again soon.' });
  }
}
