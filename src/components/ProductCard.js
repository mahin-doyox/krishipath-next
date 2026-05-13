'use client';
import { useAuth } from './AuthProvider';

export default function ProductCard({ product }) {
  const { user, supabase } = useAuth();

  const expressInterest = async () => {
    if (!user) return alert('আগ্রহ দেখাতে লগইন করুন।');
    const { data: p } = await supabase.from('products').select('user_id').eq('id', product.id).single();
    if (p) {
      await supabase.from('notifications').insert([{ user_id: p.user_id, message: `📢 আপনার পণ্যে একজন ব্যবসায়ী আগ্রহ প্রকাশ করেছেন।` }]);
      alert('আগ্রহ প্রকাশ করা হয়েছে! কৃষক অবহিত হবেন।');
    }
  };

  return (
    <div className="feature-card">
      {product.image_url && (
        <img src={product.image_url} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '1rem' }} alt={product.name} />
      )}
      <h4>{product.name}</h4>
      <p>{product.description || ''}</p>
      <small>বিক্রেতা: {product.user_name}</small>
      <br />
      <button className="btn btn-outline btn-sm mt-2" onClick={expressInterest}>আগ্রহী</button>
    </div>
  );
}