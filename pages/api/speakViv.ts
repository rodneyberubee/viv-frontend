try {
  const body = req.body || {};
  const structuredText = `The backend responded with this structured object:\n\n${JSON.stringify(body, null, 2)}\n\nPlease respond appropriately to the customer.`;

  console.log('[speakViv] 📨 Structured Payload to OpenAI:\n', structuredText);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: structuredText }
    ],
    temperature: 0.7
  });

  console.log('[speakViv] 🧠 RAW Completion Object:\n', JSON.stringify(completion, null, 2));

  const response = completion.choices?.[0]?.message?.content?.trim();

  if (!response) {
    console.warn('[speakViv] ❌ Viv A returned an empty response');
    return res.status(200).json({
      spokenResponse: "⚠️ Viv didn't know what to say. Please try again or rephrase."
    });
  }

  return res.status(200).json({ spokenResponse: response });

} catch (error) {
  console.error('[speakViv] ❌ OpenAI Error:', error);
  return res.status(500).json({
    spokenResponse: '⚠️ Sorry, something broke while talking to Viv.'
  });
}
