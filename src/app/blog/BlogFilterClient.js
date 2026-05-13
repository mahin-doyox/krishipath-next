'use client';
import { useState } from 'react';
import BlogCard from '@/components/BlogCard';

const categories = ['all', 'ফসল', 'মৎস্য', 'পশুপালন', 'জৈব সার'];

export default function BlogFilterClient({ blogs }) {
  const [cat, setCat] = useState('all');
  const filtered = cat === 'all' ? blogs : blogs.filter(b => b.category === cat);

  return (
    <>
      <div className="filter-tabs">
        {categories.map(c => (
          <button key={c} className={`filter-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'সব' : c}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {filtered.length > 0 ? filtered.map(blog => <BlogCard key={blog.id} blog={blog} />) : <p>কোনো ব্লগ নেই</p>}
      </div>
    </>
  );
}