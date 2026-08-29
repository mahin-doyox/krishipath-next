'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ProductCard from '@/components/ProductCard';

export default function BazarClient({ products }) {
  const { user, profile, supabase } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadProduct = async () => {
    if (!user || !profile || (profile.role !== 'farmer' && profile.role !== 'admin')) {
      return alert('আপনার এই কাজের অনুমতি নেই।');
    }
    if (!name.trim()) return alert('পণ্যের নাম দিন');
    
    setUploading(true);
    try {
      let imageUrl = null;
      if (file) {
        const fileName = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) {
          alert('ছবি আপলোড ত্রুটি: ' + error.message);
          setUploading(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('products').insert([{ 
        name: name.trim(), 
        description: desc.trim(), 
        image_url: imageUrl, 
        user_id: user.id, 
        user_name: profile.name, 
        approved: false 
      }]);

      if (insertError) {
        alert('পণ্য জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      } else {
        alert('পণ্য জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
        setName('');
        setDesc('');
        setFile(null);
        // ফাইল ইনপুট রিসেট
        const fileInput = document.getElementById('productImageInput');
        if (fileInput) fileInput.value = '';
        // পেজ রিলোড ছাড়াই আপডেট হতে দিলাম, কিন্তু ডেটা আপডেটের জন্য এখনই reload করতে পারো
        window.location.reload();
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি। আবার চেষ্টা করুন।');
    }
    setUploading(false);
  };

  return (
    <>
      {user && (profile?.role === 'farmer' || profile?.role === 'admin') && (
        <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          <h3 style={{ textAlign: 'center' }}>পণ্য বিক্রি করুন</h3>
          <input 
            className="form-control" 
            placeholder="পণ্যের নাম" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            maxLength={100}
          />
          <textarea 
            className="form-control mt-3" 
            rows="3" 
            placeholder="বিবরণ (যেমন: পরিমাণ, দাম, যোগাযোগ)" 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            maxLength={500}
          ></textarea>
          <input 
            id="productImageInput"
            type="file" 
            className="form-control mt-3" 
            accept="image/*"
            onChange={e => setFile(e.target.files[0])} 
          />
          <button 
            className="btn btn-primary w-100 mt-3" 
            onClick={uploadProduct}
            disabled={uploading}
          >
            {uploading ? 'পোস্ট হচ্ছে...' : 'পোস্ট করুন'}
          </button>
        </div>
      )}
      
      <div className="card-grid">
        {products.length > 0 ? (
          products.map(p => <ProductCard key={p.id} product={p} />)
        ) : (
          <div className="feature-card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>কোনো পণ্য নেই</p>
            {!user && (
              <p style={{ fontSize: '0.9rem' }}>
                <a href="/auth?mode=login" style={{ color: 'var(--primary)' }}>লগইন করুন</a>{' '}
                এবং প্রথম পণ্য পোস্ট করুন
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
