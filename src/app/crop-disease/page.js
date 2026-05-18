'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { detectDisease, saveScan, getUserScans } from '@/app/actions';

export default function CropDiseasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      getUserScans(user.id).then(setHistory);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let { width, height } = img;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
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
      router.push(`/auth?mode=login&redirect=${encodeURIComponent('/crop-disease')}`);
      return;
    }
    if (!selectedFile) return alert('দয়া করে ছবি নির্বাচন করুন');
    setLoading(true);
    setError('');
    try {
      const resizedBlob = await resizeImage(selectedFile);
      const reader = new FileReader();
      reader.readAsDataURL(resizedBlob);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        const data = await detectDisease(base64Image);
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
          // Supabase-এ সংরক্ষণ
          await saveScan(user.id, preview, data.label, data.confidence);
          // ইতিহাস আপডেট
          const updatedHistory = await getUserScans(user.id);
          setHistory(updatedHistory);
        }
        setLoading(false);
      };
    } catch (err) {
      setError('ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে।');
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
          <input type="file" accept="image/*" onChange={handleFileChange} className="form-control" style={{ padding: '10px' }} />
        </div>
        {preview && (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <img src={preview} alt="প্রিভিউ" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', border: '1px solid #ccc' }} />
          </div>
        )}
        <button className="btn btn-primary w-100 mt-3" onClick={handleSubmit} disabled={!selectedFile || loading}>
          {loading ? 'নির্ণয় করা হচ্ছে...' : 'রোগ নির্ণয় করুন'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        {result && (
          <div className="stat-card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <h3>🧬 নির্ণীত রোগ</h3>
            <div className="value" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{result.label}</div>
            <div className="trend">বিশ্বাসযোগ্যতা: {result.confidence}%</div>
          </div>
        )}
      </div>

      {/* 📋 স্ক্যান ইতিহাস */}
      {user && history.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h3 className="section-title">📋 আপনার স্ক্যান ইতিহাস</h3>
          <div className="card-grid">
            {history.map((scan) => (
              <div key={scan.id} className="feature-card" style={{ textAlign: 'left' }}>
                <img src={scan.image_url} alt={scan.disease_label} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} />
                <h4 style={{ marginTop: '0.5rem' }}>{scan.disease_label}</h4>
                <small>বিশ্বাসযোগ্যতা: {scan.confidence}%</small>
                <small style={{ display: 'block', color: '#888' }}>{new Date(scan.created_at).toLocaleDateString('bn-BD')}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
