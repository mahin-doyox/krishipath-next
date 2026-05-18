'use server';

export async function detectDisease(imageBase64) {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN;
  if (!imageBase64) {
    return { error: 'ছবি দেওয়া হয়নি' };
  }

  // হাগিং ফেস মডেল data URI আকারে পেলোড আশা করে
  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/adityasalian/plant-disease-detection',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: dataUri }),
        }
      );

      // মডেল এখনো লোড হচ্ছে (503) অথবা সার্ভার ব্যস্ত – আবার চেষ্টা
      if (response.status === 503 || response.status === 429) {
        lastError = 'মডেল লোড হচ্ছে, আবার চেষ্টা করুন...';
        await new Promise(r => setTimeout(r, 6000)); // ৬ সেকেন্ড অপেক্ষা
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || 'হাগিং ফেস API ত্রুটি' };
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // প্রথম রেজাল্টের সর্বোচ্চ স্কোর নেওয়া
        const top = data[0];
        return {
          label: top.label,
          confidence: (top.score * 100).toFixed(2),
        };
      }
      return { error: 'কোনো রোগ শনাক্ত করা যায়নি' };
    } catch (err) {
      lastError = err.message;
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 4000));
    }
  }
  return { error: lastError || 'সার্ভার ত্রুটি' };
}
