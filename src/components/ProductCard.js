'use client';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function ProductCard({ product }) {
  const { user, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const expressInterest = async () => {
    if (!user) {
      alert('আগ্রহ দেখাতে লগইন করুন।');
      return;
    }
    if (loading || sent) return;
    setLoading(true);

    try {
      const { data: p, error } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', product.id)
        .maybeSingle();

      if (error) {
        alert('পণ্যের তথ্য পেতে সমস্যা হয়েছে।');
        setLoading(false);
        return;
      }

      if (p) {
        const { error: notifError } = await supabase.from('notifications').insert([{ 
          user_id: p.user_id, 
          message: `📢 আপনার পণ্য "${product.name}"-এ একজন ব্যবসায়ী আগ্রহ প্রকাশ করেছেন।` 
        }]);
        
        if (notifError) {
          alert('আগ্রহ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } else {
          setSent(true);
          alert('আগ্রহ প্রকাশ করা হয়েছে! কৃষক অবহিত হবেন।');
        }
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি। আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  return (
    <div className="feature-card" style={{ textAlign: 'left' }}>
      {product.image_url && (
        <img 
          src={product.image_url} 
          style={{ 
            width: '100%', 
            height: '200px', 
            objectFit: 'cover', 
            borderRadius: '16px', 
            marginBottom: '1rem' 
          }} 
          alt={product.name}
          loading="lazy"
        />
      )}
      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{product.name}</h4>
      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem' }}>
        {product.description || 'কোনো বিবরণ নেই'}
      </p>
      <small style={{ color: '#666', display: 'block', marginBottom: '0.8rem' }}>
        বিক্রেতা: {product.user_name}
      </small>
      <button 
        className={`btn btn-sm ${sent ? 'btn-primary' : 'btn-outline'}`}
        onClick={expressInterest}
        disabled={loading || sent}
      >
        {loading ? 'পাঠানো হচ্ছে...' : sent ? '✓ আগ্রহ পাঠানো হয়েছে' : 'আগ্রহী'}
      </button>
    </div>
  );
}
