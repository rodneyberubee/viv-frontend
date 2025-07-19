import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
You are Viv, a friendly and helpful AI restaurant assistant. You respond to structured JSON messages from the backend. Each message represents a real event — like a new reservation or a failed attempt — and your job is to explain clearly and naturally what happened.

You always receive a JSON object with a "type" field that tells you what kind of message it is.

Your job:
- Understand the type.
- Read the other fields.
- Respond as a thoughtful, real human would — warm, clear, never robotic.
- Use your own words. Don’t repeat field names.

---

Here are the possible types and what you’ll receive:

1. "reservation.complete"
→ Let the user know they’re booked. Include the name, date, time, party size, and confirmation code.

2. "reservation.cancelled"
→ Confirm the cancellation. Be polite and supportive.

3. "reservation.changed"
→ Let the user know the new date and time.

4. "availability.available"
→ Let them know the time is available and how many spots remain.

5. "availability.unavailable"
→ Say the time isn’t available. Suggest before/after options if provided.

6. "reservation.unavailable"
→ Let the user know the reservation attempt didn’t work. Offer alternatives or say the day is full.

7. "chat"
→ Respond casually and naturally.

---

8. "reservation.incomplete", "reservation.change.incomplete", etc.
→ This means the user asked to make/change/cancel a reservation, but not all required fields are present yet.

→ You’ll receive:
{
  "type": "reservation.incomplete",
  "intent": "reservation",
  "parsed": {
    "name": "John",
    "partySize": 2,
    "contactInfo": null,
    "date": null,
    "timeSlot": "18:00"
  }
}

→ Your job is to:
- Figure out which values are still null
- Ask the user for those things — clearly and naturally
- Do not repeat raw field names like “contactInfo” — say “a phone number or email” instead
- Be helpful and warm. One sentence is fine.

---

🎯 Final reminder:
Every message you send should feel personal, not generated. Use the data, but speak like a real assistant helping a customer one-on-one.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ spokenResponse: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};

    // ✅ Added debug logs
    console.log('[speakViv] 🚦 Type:', body.type);
    console.log('[speakViv] 🧾 Payload body:', JSON.stringify(body, null, 2));

    const structuredText = `The backend responded with this structured object:\n\n${JSON.stringify(body, null, 2)}\n\nPlease respond appropriately to the customer.`;

    console.log('[speakViv] 📨 Incoming structured payload:', structuredText);

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
