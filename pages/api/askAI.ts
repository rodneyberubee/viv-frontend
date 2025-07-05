// /api/askViv.ts
export default async function handler(req, res) {
  const { userMessage, restaurantId } = req.body;

  if (!userMessage || !restaurantId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Call OpenAI with system prompt like:
  const systemPrompt = `
You are Viv, a friendly, free-speaking AI assistant for Molly's Cafe.
You can answer FAQs, chat naturally, or take reservations.
Only when the user gives reservation info, you call the reservation API.
`;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage.content }
      ]
    })
  });

  const result = await openaiResponse.json();
  const reply = result.choices?.[0]?.message?.content;

  // TODO: If Viv detects a reservation, trigger your middleware from here

  return res.status(200).json({ reply });
}

