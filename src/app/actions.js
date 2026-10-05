'use server';

import { createClient } from '@/lib/supabase/server';

// ---------- helpers ----------
async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // verified by Supabase, not client-supplied
  return { supabase, user };
}

// Needs the `rate_limits` table from supabase/security.sql
async function allowed(supabase, userId, action, max, windowMinutes) {
  const since = new Date(Date.now() - windowMinutes * 60000).toISOString();
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('action', action).gte('created_at', since);
  if ((count ?? 0) >= max) return false;
  await supabase.from('rate_limits').insert({ user_id: userId, action });
  return true;
}

const MAX_IMAGE_CHARS = 1_500_000; // ~1.1 MB base64; client already resizes to 800px

function cleanBase64(input) {
  if (typeof input !== 'string') return null;
  const b64 = input.replace(/^data:image\/\w+;base64,/, '');
  if (!b64 || b64.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(b64)) return null;
  return b64;
}

// ---------- disease detection ----------
export async function detectDisease(imageBase64) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: 'লগইন করুন' };

  const apiKey = process.env.KINDWISE_KEY; // renamed: NO "NEXT_PUBLIC_" prefix
  if (!apiKey) return { error: 'সার্ভার কনফিগারেশন ত্রুটি' };

  const b64 = cleanBase64(imageBase64);
  if (!b64) return { error: 'ছবি সঠিক নয় বা অনেক বড়' };

  if (!(await allowed(supabase, user.id, 'detect', 15, 60)))
    return { error: 'এক ঘণ্টায় অনেক বেশি স্ক্যান হয়েছে, একটু পরে চেষ্টা করুন' };

  try {
    const res = await fetch('https://crop.kindwise.com/api/v1/identification?details=common_names,treatment', {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [`data:image/jpeg;base64,${b64}`] }),
    });
    if (!res.ok) return { error: 'রোগ নির্ণয় সেবা এখন পাওয়া যাচ্ছে না' };

    const data = await res.json();
    const list = data.result?.disease?.suggestions ?? [];
    if (!list.length) return { error: 'কোনো রোগ শনাক্ত করা যায়নি, পরিষ্কার আলোয় আবার ছবি তুলুন' };

    const toItem = (s) => ({
      label: s.name,
      confidence: Number((s.probability * 100).toFixed(1)),
      treatment: s.details?.treatment ?? null,
    });
    const top = toItem(list[0]);
    return {
      label: top.label,
      confidence: top.confidence,
      treatment: top.treatment,
      others: list.slice(1, 3).map(toItem),          // show 2 alternatives
      lowConfidence: top.confidence < 50,            // UI should say "not sure, ask an officer"
    };
  } catch (e) {
    console.error('[Kindwise]', e.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}

// ---------- scan history (private storage, user id from session) ----------
export async function uploadScanImage(imageBase64) {
  const { supabase, user } = await requireUser();
  if (!user) return null;
  const b64 = cleanBase64(imageBase64);
  if (!b64) return null;

  const path = `${user.id}/${Date.now()}.jpg`;           // folder = user id (matches storage policy)
  const { error } = await supabase.storage
    .from('scans')                                        // PRIVATE bucket
    .upload(path, Buffer.from(b64, 'base64'), { contentType: 'image/jpeg' });
  if (error) { console.error('Upload', error.message); return null; }
  return path;                                            // store the path, not a public URL
}

export async function saveScan(imagePath, diseaseLabel, confidence) {
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { error } = await supabase.from('crop_scans').insert({
    user_id: user.id,
    image_url: imagePath,
    disease_label: String(diseaseLabel).slice(0, 200),
    confidence: Number(confidence),
  });
  return !error;
}

export async function getUserScans() {
  const { supabase, user } = await requireUser();
  if (!user) return [];
  const { data } = await supabase.from('crop_scans')
    .select('id,image_url,disease_label,confidence,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
  if (!data?.length) return [];
  // private bucket -> short-lived signed URLs (old rows that already hold a full http URL are kept as is)
  const paths = data.filter((d) => d.image_url && !d.image_url.startsWith('http')).map((d) => d.image_url);
  const urlByPath = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('scans').createSignedUrls(paths, 3600);
    (signed ?? []).forEach((s) => { if (s.path && s.signedUrl) urlByPath[s.path] = s.signedUrl; });
  }
  return data.map((d) => ({
    ...d,
    image_url: d.image_url?.startsWith('http') ? d.image_url : urlByPath[d.image_url] ?? null,
  }));
}

// ---------- AI crop chat ----------
const SYSTEM_PROMPT = `তুমি কৃষিপথের কৃষি সহায়ক। বাংলাদেশের কৃষকদের জন্য সহজ বাংলায়, সংক্ষেপে উত্তর দেবে।
নিয়ম:
- আগে জৈব ও সমন্বিত বালাই ব্যবস্থাপনা (IPM) বলবে, তারপর প্রয়োজনে রাসায়নিক।
- ওষুধের নাম বললে লেবেলের মাত্রা মানতে এবং সুরক্ষা পোশাক পরতে বলবে; নিজে থেকে নির্দিষ্ট মাত্রা বানিয়ে বলবে না।
- নিশ্চিত না হলে স্পষ্ট বলবে এবং স্থানীয় উপজেলা কৃষি অফিস/উপ-সহকারী কৃষি কর্মকর্তার সাথে যোগাযোগ করতে বলবে।
- কৃষি-বহির্ভূত প্রশ্নের উত্তর দেবে না।`;

export async function sendChatMessage(message) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: 'লগইন করুন' };

  const text = String(message ?? '').trim().slice(0, 800);
  if (!text) return { error: 'মেসেজ দিন' };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: 'সার্ভার কনফিগারেশন ত্রুটি' };

  if (!(await allowed(supabase, user.id, 'chat', 30, 60)))
    return { error: 'এক ঘণ্টায় ৩০টির বেশি প্রশ্ন করা যাবে না' };

  // last 4 exchanges so follow-up questions make sense
  const { data: past } = await supabase.from('crop_chats')
    .select('message,reply').eq('user_id', user.id)
    .order('created_at', { ascending: false }).limit(4);
  const history = (past ?? []).reverse().flatMap((c) => [
    { role: 'user', content: c.message },
    { role: 'assistant', content: c.reply },
  ]);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: text }],
        temperature: 0.3,       // advice should be steady, not creative
        max_tokens: 900,
      }),
    });
    if (!res.ok) return { error: 'এখন উত্তর দেওয়া যাচ্ছে না, পরে চেষ্টা করুন' };

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return { error: 'কোনো উত্তর পাওয়া যায়নি' };

    await supabase.from('crop_chats').insert({ user_id: user.id, message: text, reply });
    return { reply };
  } catch (e) {
    console.error('[Groq]', e.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}

export async function getChatHistory() {
  const { supabase, user } = await requireUser();
  if (!user) return [];
  const { data } = await supabase.from('crop_chats')
    .select('id,message,reply,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(50);
  return data ?? [];
}
