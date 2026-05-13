'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ProductCard from '@/components/ProductCard';

export default function BazarClient({ products }) {
  const { user, profile, supabase } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);

  const uploadProduct = async () => {
    if (!user || !profile || (profile.role !== 'farmer' && profile.role !== 'admin')) {
      return alert('আপনার এই কাজের অনুমতি নেই।');
    }
    if (!name) return alert('পণ্যের নাম দিন');
    let imageUrl = null;
    if (file) {
      const fileName = 'prod_' + Date.now();
      const { error } = await supabase.storage.from('images').upload(fileName, file);
      if (error) return alert('ছবি আপলোড ত্রুটি: ' + error.message);
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
    await supabase.from('products').insert([{ name, description: desc, image_url: imageUrl, user_id: user.id, user_name: profile.name, approved: false }]);
    alert('পণ্য জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
    setName(''); setDesc(''); setFile(null);
    // refetch or just reload
    window.location.reload();
  };

  return (
    <>
      {user && (profile?.role === 'farmer' || profile?.role === 'admin') && (
        <div className="form-card">
          <h3>পণ্য বিক্রি করুন</h3>
          <input className="form-control" placeholder="পণ্যের নাম" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="form-control mt-3" rows="3" placeholder="বিবরণ" value={desc} onChange={e => setDesc(e.target.value)}></textarea>
          <input type="file" className="form-control mt-3" onChange={e => setFile(e.target.files[0])} />
          <button className="btn btn-primary w-100 mt-3" onClick={uploadProduct}>পোস্ট করুন</button>
        </div>
      )}
      <div className="card-grid">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
        {products.length === 0 && <p>কোনো পণ্য নেই</p>}
      </div>
    </>
  );
}