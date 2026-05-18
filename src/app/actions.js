'use server';

export async function detectDisease(imageBase64) {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN;
  if (!imageBase64) {
    return { error: 'ছবি দেওয়া হয়নি' };
  }

  // HF মডেল raw base64 string আশা করে (data URI নয়)
  // কিন্তু কিছু মডেল data URI চায়, আমরা উভয় চেষ্টা করব
  const payloads = [
    `data:image/jpeg;base64,${imageBase64}`,
    imageBase64
  ];

  for (const payload of payloads) {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/dennisjooo/Bangla-Crop-Disease-Detection',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: payload }),
          }
        );

        // সার্ভার ব্যস্ততা
        if ([503, 429, 502, 500].includes(response.status)) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error || response.statusText;
          console.log(`[HF] Attempt ${attempt} (${response.status}): ${msg}`);
          lastError = msg || 'সার্ভার ব্যস্ত, আবার চেষ্টা করুন...';
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 6000));
            continue;
          }
          return { error: lastError };
        }

        // সুস্পষ্ট ত্রুটি
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error || 'হাগিং ফেস API ত্রুটি';
          console.error(`[HF] Error: ${msg}`);
          // এই পেলোড ফরম্যাটে সমস্যা থাকলে পরবর্তী পেলোড চেষ্টা করবে
          break;
        }

        // সফল
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const top = data[0];
          return {
            label: top.label,
            confidence: (top.score * 100).toFixed(2),
          };
        }
        return { error: 'কোনো রোগ শনাক্ত করা যায়নি' };
      } catch (err) {
        console.error(`[HF] Network error: ${err.message}`);
        lastError = err.message;
        if (attempt === 3) break;
        await new Promise(r => setTimeout(r, 4000));
      }
    }
    // প্রথম পেলোড কাজ না করলে দ্বিতীয় পেলোড চেষ্টা করবে
  }
  return { error: 'হাগিং ফেস API ত্রুটি' };
}
