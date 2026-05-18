'use server';

export async function detectDisease(imageBase64) {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN;
  if (!imageBase64) {
    return { error: 'ছবি দেওয়া হয়নি' };
  }

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

      // 🔍 সম্পূর্ণ স্ট্যাটাস ও বডি লগ করো
      const responseBody = await response.text();
      console.log(`[HF] Attempt ${attempt} - Status: ${response.status}`);
      console.log(`[HF] Attempt ${attempt} - Body: ${responseBody}`);

      // পরিচিত ক্ষণস্থায়ী ত্রুটি
      if ([503, 429, 502, 500].includes(response.status)) {
        let msg = responseBody;
        try { msg = JSON.parse(responseBody).error || msg; } catch {}
        console.log(`[HF] Transient error, retrying...`);
        lastError = msg || 'সার্ভার ব্যস্ত, আবার চেষ্টা করুন...';
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 6000));
          continue;
        }
        return { error: lastError };
      }

      // অন্যান্য ত্রুটি
      if (!response.ok) {
        let errorMsg = responseBody;
        try { errorMsg = JSON.parse(responseBody).error || errorMsg; } catch {}
        console.error(`[HF] Non-transient error: ${errorMsg}`);
        return { error: errorMsg };
      }

      // সফল রেসপন্স প্রসেস
      const data = JSON.parse(responseBody);
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
  return { error: lastError || 'সার্ভার ত্রুটি' };
}
