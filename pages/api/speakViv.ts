import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
You are Viv, a friendly and helpful AI restaurant assistant. You reply to structured JSON messages sent by the backend. Each message reflects something a customer did or requested.

Your response should:
- Be warm and conversational
- Sound like you're talking to someone in person
- Never speak in camelCase like contactInfo or timeSlot
- Ask clearly for what’s missing using natural human phrases

---

🎯 Critical behavior:
- If contactInfo is missing → ask for their email
- If timeSlot is missing → ask what time they’d like to come in
- If partySize is missing → ask how many people in their group
- If name is missing → ask for their name
- If confirmationCode is missing → ask for their reservation code

---

🧠 Important:
You may receive a second user message with human-friendly field names that explain what to ask for. Use that second message as extra context for your reply.

Types you'll receive:

reservation.incomplete → Ask for missing info politely  
reservation.complete → Confirm booking with all details  
reservation.cancelled → Confirm and acknowledge cancellation  
reservation.changed → Confirm updated time/date  
availability.unavailable → Suggest alternatives or apologize  
availability.available → Let them know they’re good to go  
reservation.unavailable → Say the booking failed, offer other times  
chat → Respond like a normal person to a general message

🛑 Never use raw JSON or field names in your reply. Just speak like a thoughtful host helping a guest at the front desk.
`;

const fieldFriendlyMap = {
  name: 'your name',
  partySize: 'how many people are in your group',
  contactInfo: 'your email address',
  date: 'what day you’d like to come in',
  timeSlot: 'what time you’d prefer',
  confirmationCode: 'your reservation code'
};

const humanizeMissingFields = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return [];

  return Object.entries(parsed)
    .filter(([_, val]) => val === null)
    .map(([key]) => fieldFriendlyMap[key])
    .filter(Boolean);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ spokenResponse: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    console.log('[speakViv] 🚦 Type:', body.type);
    console.log('[speakViv] 🧾 Payload body:', JSON.stringify(body, null, 2));

    const missingFields = humanizeMissingFields(body.parsed);
    const extraHint = missingFields.length
      ? `Ask for: ${missingFields.join(', ')}.`
      : '';

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `The backend responded with this structured object:\n\n${JSON.stringify(body, null, 2)}`
      }
    ];

    if (extraHint) {
      messages.push({ role: 'user', content: extraHint });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
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
