'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CropDiseasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ছবি সিলেক্ট করলে ইমিডিয়েটলি রিসাইজ করে স্টেটে রাখবে
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // ছবির প্রিভিউ তৈরি
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setResult(null);
    setError('');
  };

  // ক্লায়েন্ট-সাইডে ছবি রিসাইজ করার ফাংশন
  const resizeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // সর্বোচ্চ প্রস্থ
          let { width, height } = img;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 0.7 কোয়ালিটিতে JPEG বানাও, যাতে সাইজ কম থাকে
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('ছবি রিসাইজ ব্যর্থ'));
              resolve(blob);
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      const currentPath = '/crop-disease';
      router.push(`/auth?mode=login&redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!selectedFile) return alert('দয়া করে ছবি নির্বাচন করুন');
    setLoading(true);
    setError('');

    try {
      // প্রথমে ছবি রিসাইজ করো
      const resizedBlob = await resizeImage(selectedFile);
      
      // তারপর রিসাইজ করা ব্লবকে বেস64-তে রূপান্তর করো
      const reader = new FileReader();
      reader.readAsDataURL(resizedBlob);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1]; // বেস64 পেলোড

        // এখন আমাদের নিজস্ব API কল করো
        const response = await fetch('/api/detect-disease', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'API ত্রুটি');
        }

        if (Array.isArray(data) && data.length > 0) {
          const topPrediction = data[0];
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
      setError(err.message || 'রোগ নির্ণয়ে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">🔍 ফসলের রোগ নির্ণয়</h2>
      {!user && (
        <div className="form-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p>⚠️ এই ফিচারটি ব্যবহার করতে লগইন করুন।</p>
          <Link href={`/auth?mode=login&redirect=${encodeURIComponent('/crop-disease')}`} className="btn btn-primary btn-sm">
            লগইন / রেজিস্টার
          </Link>
        </div>
      )}
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
