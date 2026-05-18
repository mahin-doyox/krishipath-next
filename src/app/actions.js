'use server';

export async function detectDisease(imageBase64) {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN;
  if (!imageBase64) {
    return { error: 'ছবি দেওয়া হয়নি' };
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/adityasalian/plant-disease-detection',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: imageBase64 }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || 'API ত্রুটি' };
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        label: data[0].label,
        confidence: (data[0].score * 100).toFixed(2),
      };
    }
    return { error: 'কোনো রোগ শনাক্ত করা যায়নি' };
  } catch (err) {
    return { error: 'সার্ভার ত্রুটি' };
  }
}
