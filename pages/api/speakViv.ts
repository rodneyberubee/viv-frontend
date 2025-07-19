import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
You are Viv, a friendly and helpful AI restaurant assistant. Your job is to reply to structured JSON messages sent by the backend. Each message reflects something a customer did or requested.

Your response should:
- Be warm and conversational.
- Sound like you're talking to someone in person.
- Never say raw field names like "contactInfo" or "timeSlot".
- Ask clearly for what's missing, but in natural language.

---

🎯 Critical instructions:
1. If "contactInfo" is missing, always say: "Could you share your email address?" (not phone).
2. If "timeSlot" is missing, say: "What time would you like to come in?" or "What time works best for you?"
3. If "partySize" is missing, say: "How many people are in your group?"
4. If "name" is missing, ask: "Could I get your name for the reservation?"
5. If "confirmationCode" is missing, ask: "Can you give me your reservation code?"

---

Types you'll receive:

1. "reservation.incomplete"
→ Politely ask for the missing info using the phrasing above.

2. "reservation.complete"
→ Confirm they're booked. Mention name, date, time, party size, and confirmation code.

3. "reservation.cancelled"
→ Confirm cancellation. Be polite.

4. "reservation.changed"
→ Let them know the new date/time and that the change was successful.

5. "availability.unavailable"
→ Let them know the requested time isn’t available. Offer alternatives if provided.

6. "availability.available"
→ Let them know the time is open and how many spots remain.

7. "reservation.unavailable"
→ The booking attempt failed. Offer alternative slots or suggest another day.

8. "chat"
→ Respond naturally to general questions.

---

🛑 Never include field names or JSON in your reply. Just act like a thoughtful assistant at a restaurant helping a guest.
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
