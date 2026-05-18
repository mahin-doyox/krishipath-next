'use server';

import { createClient } from '@/lib/supabase/server';

export async function detectDisease(imageBase64) {
  const apiKey = process.env.NEXT_PUBLIC_PLANTID_KEY;
  if (!apiKey) return { error: 'API কী সেট করা নেই' };
  if (!imageBase64) return { error: 'ছবি দেওয়া হয়নি' };

  try {
    const response = await fetch('https://api.plant.id/v2/health_assessment', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${imageBase64}`],
        similar_images: false,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.message || 'Plant.id API ত্রুটি' };
    }

    const data = await response.json();

    if (data.health_assessment?.diseases?.length > 0) {
      const top = data.health_assessment.diseases[0];
      return {
        label: top.name || 'রোগ শনাক্ত হয়েছে',
        confidence: (top.probability * 100).toFixed(1),
      };
    }

    if (data.health_assessment?.is_healthy) {
      return { label: 'সুস্থ উদ্ভিদ 🌱', confidence: 100 };
    }

    return { error: 'কোনো রোগ শনাক্ত করা যায়নি' };
  } catch (err) {
    console.error('[PlantID] Network error:', err.message);
    return { error: 'সার্ভার ত্রুটি' };
  }
}

// ইতিহাস সংরক্ষণ
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

// ইউজারের ইতিহাস ফেচ
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
