'use client';
import { useState } from 'react';

export default function CropDiseasePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedFile) return alert('দয়া করে ছবি নির্বাচন করুন');
    setLoading(true);
    setError('');

    try {
      // ছবিকে base64 এ রূপান্তর
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1]; // data:image/... সরিয়ে ফেলা

        // Hugging Face API কল
        const response = await fetch(
          'https://api-inference.huggingface.co/models/adityasalian/plant-disease-detection',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: base64Image }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'API ত্রুটি');
        }

        // রেসপন্স প্রসেস: সবচেয়ে বেশি কনফিডেন্সের ক্লাস দেখাবে
        if (Array.isArray(data) && data.length > 0) {
          const topPrediction = data[0]; // প্রথম ফলাফল
          setResult({
            label: topPrediction.label,
            confidence: (topPrediction.score * 100).toFixed(2),
          });
        } else {
          setResult({ label: 'অজানা', confidence: 0 });
        }
        setLoading(false);
      };
    } catch (err) {
      setError('রোগ নির্ণয়ে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">🔍 ফসলের রোগ নির্ণয়</h2>
      <div className="form-card">
        <div className="form-group">
          <label>ফসলের পাতা বা আক্রান্ত অংশের ছবি আপলোড করুন</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="form-control" />
        </div>
        {preview && (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px' }} />
          </div>
        )}
        <button className="btn btn-primary w-100 mt-3" onClick={handleSubmit} disabled={!selectedFile || loading}>
          {loading ? 'নির্ণয় করা হচ্ছে...' : 'রোগ নির্ণয় করুন'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

        {result && (
          <div className="stat-card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <h3>🧬 নির্ণীত রোগ</h3>
            <div className="value" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{result.label}</div>
            <div className="trend">বিশ্বাসযোগ্যতা: {result.confidence}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
