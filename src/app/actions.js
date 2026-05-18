export async function sendChatMessage(userId, message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: 'API কী সেট করা নেই' };
  if (!message?.trim()) return { error: 'মেসেজ দিন' };

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview',
          messages: [
            {
              role: 'system',
              content: 'তুমি একজন কৃষি বিশেষজ্ঞ। ব্যবহারকারী যখন কোনো ফসলের রোগের নাম বলবে, তুমি সেই রোগের জন্য প্রয়োজনীয় ওষুধের নাম, প্রয়োগ পদ্ধতি, এবং জৈব বিকল্প সহ পরামর্শ দেবে। বাংলায় উত্তর দেবে। সংক্ষিপ্ত কিন্তু তথ্যবহুল উত্তর দেবে।',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.error?.message || 'Gemini API ত্রুটি' };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'কোনো উত্তর পাওয়া যায়নি';

    // Supabase-এ সংরক্ষণ
    const supabase = await createClient();
    await supabase.from('crop_chats').insert({
      user_id: userId,
      message,
      reply,
    });

    return { reply };
  } catch (err) {
    console.error('[Gemini] Network error:', err.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}
