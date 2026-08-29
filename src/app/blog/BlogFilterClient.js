'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BlogCard from '@/components/BlogCard';
import BlogCardSkeleton from '@/components/BlogCardSkeleton';

const categories = ['all', 'ফসল', 'মৎস্য', 'পশুপালন', 'জৈব সার'];

export default function BlogFilterClient({ blogs }) {
  const { user, profile, supabase } = useAuth();
  const [cat, setCat] = useState('all');
  const [title, setTitle] = useState('');
  const [blogCat, setBlogCat] = useState('ফসল');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const filtered = cat === 'all' ? blogs : blogs.filter(b => b.category === cat);

  useEffect(() => {
    // ব্লগ প্রপস পাওয়ার পর লোডিং শেষ
    if (blogs && blogs.length >= 0) {
      setLoading(false);
    }
  }, [blogs]);

  const uploadBlog = async () => {
    if (!user || !profile || (profile.role !== 'expert' && profile.role !== 'admin')) {
      return alert('আপনার এই কাজের অনুমতি নেই।');
    }
    if (!title.trim() || !content.trim()) return alert('শিরোনাম ও লেখা দিন');
    
    setUploading(true);
    try {
      const { error } = await supabase.from('blogs').insert([{
        title: title.trim(),
        category: blogCat,
        content: content.trim(),
        user_id: user.id,
        user_name: profile.name,
        approved: false
      }]);
      
      if (error) {
        alert('ব্লগ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      } else {
        alert('জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
        setTitle('');
        setContent('');
        window.location.reload();
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি। আবার চেষ্টা করুন।');
    }
    setUploading(false);
  };

  return (
    <>
      {/* ব্লগ আপলোড ফর্ম */}
      {user && (profile?.role === 'expert' || profile?.role === 'admin') && (
        <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          <h3 style={{ textAlign: 'center' }}>ব্লগ লিখুন</h3>
          <input 
            className="form-control" 
            placeholder="শিরোনাম" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            maxLength={200}
          />
          <select className="form-control mt-3" value={blogCat} onChange={e => setBlogCat(e.target.value)}>
            <option value="ফসল">ফসল</option>
            <option value="মৎস্য">মৎস্য</option>
            <option value="পশুপালন">পশুপালন</option>
            <option value="জৈব সার">জৈব সার</option>
          </select>
          <textarea 
            className="form-control mt-3" 
            rows="5" 
            placeholder="আপনার লেখা" 
            value={content} 
            onChange={e => setContent(e.target.value)}
            style={{ whiteSpace: 'pre-wrap' }}
          ></textarea>
          <button 
            className="btn btn-primary w-100 mt-3" 
            onClick={uploadBlog}
            disabled={uploading}
          >
            {uploading ? 'প্রকাশ হচ্ছে...' : 'প্রকাশ করুন'}
          </button>
        </div>
      )}

      {/* ফিল্টার ট্যাব */}
      <div className="filter-tabs" style={{ flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
        {categories.map(c => (
          <button 
            key={c} 
            className={`filter-tab ${cat === c ? 'active' : ''}`} 
            onClick={() => setCat(c)}
            style={{ flexShrink: 0 }}
          >
            {c === 'all' ? 'সব' : c}
          </button>
        ))}
      </div>

      {/* ব্লগ তালিকা অথবা স্কেলিটন */}
      {loading ? (
        <div className="card-grid">
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
        </div>
      ) : filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map(blog => <BlogCard key={blog.id} blog={blog} />)}
        </div>
      ) : (
        <div className="feature-card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>কোনো ব্লগ নেই</p>
          {!user && (
            <p style={{ fontSize: '0.9rem' }}>
              <a href="/auth?mode=login" style={{ color: 'var(--primary)' }}>লগইন করুন</a>
              {' '}এবং প্রথম ব্লগ লিখুন
            </p>
          )}
        </div>
      )}
    </>
  );
}
