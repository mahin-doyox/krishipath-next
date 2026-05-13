'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BlogCard from '@/components/BlogCard';

const categories = ['all', 'ফসল', 'মৎস্য', 'পশুপালন', 'জৈব সার'];

export default function BlogFilterClient({ blogs }) {
  const { user, profile, supabase } = useAuth();
  const [cat, setCat] = useState('all');
  const [title, setTitle] = useState('');
  const [blogCat, setBlogCat] = useState('ফসল');
  const [content, setContent] = useState('');
  const filtered = cat === 'all' ? blogs : blogs.filter(b => b.category === cat);

  const uploadBlog = async () => {
    if (!user || !profile || (profile.role !== 'expert' && profile.role !== 'admin')) {
      return alert('আপনার এই কাজের অনুমতি নেই।');
    }
    if (!title || !content) return alert('শিরোনাম ও লেখা দিন');
    await supabase.from('blogs').insert([{
      title,
      category: blogCat,
      content,
      user_id: user.id,
      user_name: profile.name,
      approved: false
    }]);
    alert('জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
    setTitle(''); setContent('');
    window.location.reload();
  };

  return (
    <>
      {/* ব্লগ আপলোড ফর্ম – শুধু expert ও admin দেখবে */}
      {user && (profile?.role === 'expert' || profile?.role === 'admin') && (
        <div className="form-card">
          <h3>ব্লগ লিখুন</h3>
          <input className="form-control" placeholder="শিরোনাম" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="form-control mt-3" value={blogCat} onChange={e => setBlogCat(e.target.value)}>
            <option value="ফসল">ফসল</option>
            <option value="মৎস্য">মৎস্য</option>
            <option value="পশুপালন">পশুপালন</option>
            <option value="জৈব সার">জৈব সার</option>
          </select>
          <textarea className="form-control mt-3" rows="5" placeholder="আপনার লেখা" value={content} onChange={e => setContent(e.target.value)}></textarea>
          <button className="btn btn-primary w-100 mt-3" onClick={uploadBlog}>প্রকাশ করুন</button>
        </div>
      )}

      {/* ফিল্টার ট্যাব */}
      <div className="filter-tabs">
        {categories.map(c => (
          <button key={c} className={`filter-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'সব' : c}
          </button>
        ))}
      </div>

      {/* ব্লগ তালিকা */}
      <div className="card-grid">
        {filtered.length > 0 ? filtered.map(blog => <BlogCard key={blog.id} blog={blog} />) : <p>কোনো ব্লগ নেই</p>}
      </div>
    </>
  );
}