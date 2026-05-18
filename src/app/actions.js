'use server';

import { createClient } from '@/lib/supabase/server';

// ======================================================================
// 🔍 ফসলের রোগ নির্ণয় (Kindwise API)
// ======================================================================
export async function detectDisease(imageBase64) {
  const apiKey = process.env.NEXT_PUBLIC_KINDWISE_KEY;
  if (!apiKey) return { error: 'API কী সেট করা নেই' };
  if (!imageBase64) return { error: 'ছবি দেওয়া হয়নি' };

  try {
    const response = await fetch('https://crop.kindwise.com/api/v1/identification', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [imageBase64],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Kindwise API ত্রুটি' };
    }

    const data = await response.json();

    if (data.result?.disease?.suggestions?.length > 0) {
      const top = data.result.disease.suggestions[0];
      return {
        label: top.name || 'রোগ শনাক্ত হয়েছে',
        confidence: (top.probability * 100).toFixed(1),
      };
    }

    return { error: 'কোনো রোগ শনাক্ত করা যায়নি' };
  } catch (err) {
    console.error('[Kindwise] Network error:', err.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}

// ======================================================================
// 📤 ছবি Supabase Storage-এ আপলোড (স্ক্যান ইতিহাসের জন্য)
// ======================================================================
export async function uploadScanImage(base64Image, userId) {
  const supabase = await createClient();
  const fileName = `scans/${userId}_${Date.now()}.jpg`;

  const byteString = atob(base64Image);
  const mimeString = 'image/jpeg';
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrl;
}

// ======================================================================
// 💾 স্ক্যান ইতিহাস সংরক্ষণ ও পড়া
// ======================================================================
export async function saveScan(userId, imageUrl, diseaseLabel, confidence) {
  const supabase = await createClient();
  const { error } = await supabase.from('crop_scans').insert({
    user_id: userId,
    image_url: imageUrl,
    disease_label: diseaseLabel,
    confidence: parseFloat(confidence),
  });
  if (error) {
    console.error('Save scan error:', error.message);
    return false;
  }
  return true;
}

export async function getUserScans(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crop_scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data;
}

// ======================================================================
// 💬 কৃষি চ্যাট (Groq Cloud – Llama 3.3 70B, সম্পূর্ণ ফ্রি)
// ======================================================================
export async function sendChatMessage(userId, message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: 'API কী সেট করা নেই' };
  if (!message?.trim()) return { error: 'মেসেজ দিন' };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',   // Groq-এর ফ্রি, দ্রুত ও শক্তিশালী মডেল
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
        max_tokens: 1500,   // সম্পূর্ণ উত্তরের জন্য পর্যাপ্ত
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.error?.message || 'Groq API ত্রুটি' };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const reply = choice?.message?.content || 'কোনো উত্তর পাওয়া যায়নি';

    // finish_reason চেক (length হলে টোকেনে কাটা পড়েছে)
    if (choice?.finish_reason === 'length') {
      console.warn('[Groq] Response truncated due to token limit');
    }

    // হিস্টরি Supabase-এ সংরক্ষণ
    const supabase = await createClient();
    await supabase.from('crop_chats').insert({
      user_id: userId,
      message,
      reply,
    });

    return { reply };
  } catch (err) {
    console.error('[Groq] Network error:', err.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}

export async function getChatHistory(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crop_chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) return [];
  return data;
}
