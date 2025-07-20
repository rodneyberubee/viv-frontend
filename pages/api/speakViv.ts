import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🧠 Friendly label translation map
const fieldFriendlyMap = {
  name: 'your name',
  party size: 'how many people are in your party',
  contact info: 'your email',
  date: 'which day you’d like to come in',
  time slot: 'what time you’d prefer',
  confirmation code: 'your reservation code'
};

// 🔍 Extract missing fields as readable phrases
const humanizeMissingFields = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return [];

  return Object.entries(parsed)
    .filter(([_, val]) => val === null)
    .map(([key]) => fieldFriendlyMap[key])
    .filter(Boolean);
};

const systemPrompt = `
You are Viv, a friendly and helpful AI restaurant assistant. You respond to structured messages from the backend. Each message reflects something a customer did or requested.

Your job:
- Respond warmly, like you're talking to someone in person.
- Never repeat internal field names like "contact info" or "time slot".
- Use natural language to ask for whatever is missing or confirm what just happened.

---

Types you'll receive:

- "reservation.incomplete"
  → Ask politely for the missing fields, using plain language.

- "reservation.complete"
  → Confirm the booking with name, date, time, party size, and confirmation code.

- "reservation.cancelled"
  → Confirm cancellation. Be kind.

- "reservation.changed"
  → Confirm the new time and date.

- "availability.unavailable"
  → Let them know the time isn’t available. Offer any suggestions if present.

- "availability.available"
  → Let them know the time is open and how many spots are left.

- "reservation.unavailable"
  → Say the reservation attempt failed. Suggest next steps.

- "chat"
  → Just respond casually, as if chatting.

🛑 Never speak in JSON. Never repeat camelCase field names. Just help like a real human assistant would.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ spokenResponse: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};

    console.log('[speakViv] 🚦 Type:', body.type);
    console.log('[speakViv] 🧾 Payload body:', JSON.stringify(body, null, 2));

    const missingFields = humanizeMissingFields(body.parsed);
    const friendlyHint = missingFields.length
      ? `The customer didn’t provide: ${missingFields.join(', ')}. Please ask for those in your own words.`
      : `All required details are present. Please confirm the request clearly and naturally.`;

    const structuredText = [
      `Here is the customer request type: ${body.type}`,
      friendlyHint,
      '---',
      'Structured payload for reference:',
      '```json',
      JSON.stringify(body, null, 2),
      '```'
    ].join('\n\n');

    console.log('[speakViv] 📨 Incoming structured prompt:\n', structuredText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: structuredText }
      ],
      temperature: 0.7
    });

    const response = completion.choices?.[0]?.message?.content?.trim() || '';
    console.log('[speakViv] 🧠 Raw completion object:', JSON.stringify(completion, null, 2));

    return res.status(200).json({ spokenResponse: response });
  } catch (error) {
    console.error('[speakViv] ❌ OpenAI error:', error);
    return res.status(500).json({ spokenResponse: '⚠️ Sorry, I had trouble replying just now.' });
  }
}
