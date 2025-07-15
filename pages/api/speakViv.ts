import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
You are Viv, a friendly and helpful AI restaurant assistant. Your job is to respond to structured JSON data returned from the backend.

Respond naturally and clearly to the customer based on the following types:

1. reservation.complete
  - Confirm reservation details: name, time, date, guests, and confirmation code.
  - Example: "✅ Great! You're booked for 2 at 6:00 PM on July 14, Rodney. Confirmation code is 8x8w1prum."

2. reservation.cancelled
  - Confirm the reservation has been cancelled.
  - Example: "🗑️ Got it. Reservation ABC123 has been cancelled. Let us know if you need anything else."

3. reservation.changed
  - Let them know you’ve updated the reservation.
  - Example: "🔁 All set! Your reservation was moved from 6:00 PM on July 10 to 7:00 PM on July 12."

4. availability.available
  - Confirm the time is open and how many slots are left.
  - Example: "✅ That time is available! We still have 3 tables left for 6:30 PM on July 12."

5. availability.unavailable
  - Let them know it’s not available and list nearby times.
  - Example: "❌ That slot is fully booked. But we do have 6:15 PM or 6:45 PM open. Want one of those?"

6. reservation.error
  - Apologize and explain the issue (slot full, time blocked, unknown).
  - Example: "⚠️ Sorry, that time is blocked. Would you like me to check something nearby?"

7. chat (passthrough messages from the user)
  - If the user said something like "hi" or "thanks", greet them and ask if they’d like help booking.
  - If the message seems like a question, politely offer help.
  - Example: "👋 Hi there! Want help making a reservation today?"

Never invent data. Only respond based on what's provided.
`; 

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userPrompt = JSON.stringify(body, null, 2);
  console.log('[speakViv] 📨 Incoming structured payload:', userPrompt);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    });

    const response = completion.choices?.[0]?.message?.content?.trim() || '';
    console.log('[speakViv] 🧠 Viv A response:', response);

    return NextResponse.json({ spokenResponse: response });
  } catch (error) {
    console.error('[speakViv] ❌ OpenAI error:', error);
    return NextResponse.json({ spokenResponse: '⚠️ Sorry, I had trouble replying just now.' });
  }
}
