'use client';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getRelativeTime } from '@/lib/relativeTime';
import Link from 'next/link';

export default function TodaysBest() {
  const { supabase } = useAuth();
  const [topPrice, setTopPrice] = useState(null);
  const [latestBlog, setLatestBlog] = useState(null);
  const [topQuestion, setTopQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: price } = await supabase
        .from('agent_prices')
        .select('id,crop,price,area,district,division')
        .eq('approved', true)
        .gte('created_at', todayStart)
        .order('price', { ascending: false })
        .limit(1)
        .maybeSingle();
      setTopPrice(price);

      const { data: blog } = await supabase
        .from('blogs')
        .select('id,title,user_name,created_at,category')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestBlog(blog);

      const { data: question } = await supabase
        .from('forum_questions')
        .select('id,title,user_name,created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setTopQuestion(question);
    } catch (err) {
      console.warn('TodaysBest fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="card-grid">
        <div className="feature-card skeleton-card">
          <div className="skeleton" style={{ width: '60%', height: '1.2rem', margin: '0 auto 0.8rem' }}></div>
          <div className="skeleton" style={{ width: '40%', height: '1.5rem', margin: '0 auto 0.5rem' }}></div>
          <div className="skeleton" style={{ width: '70%', height: '0.9rem', margin: '0 auto' }}></div>
        </div>
        <div className="feature-card skeleton-card">
          <div className="skeleton" style={{ width: '60%', height: '1.2rem', margin: '0 auto 0.8rem' }}></div>
          <div className="skeleton" style={{ width: '80%', height: '1.5rem', margin: '0 auto 0.5rem' }}></div>
          <div className="skeleton" style={{ width: '40%', height: '0.9rem', margin: '0 auto' }}></div>
        </div>
        <div className="feature-card skeleton-card">
          <div className="skeleton" style={{ width: '60%', height: '1.2rem', margin: '0 auto 0.8rem' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '1.5rem', margin: '0 auto 0.5rem' }}></div>
          <div className="skeleton" style={{ width: '70%', height: '0.9rem', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {topPrice && (
        <div className="feature-card" style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>🔥 আজকের সর্বোচ্চ দাম</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.5rem 0' }}>
            {topPrice.crop} — {topPrice.price} টাকা
          </p>
          <small style={{ color: '#666' }}>
            {topPrice.area}, {topPrice.district}
          </small>
        </div>
      )}

      {latestBlog && (
        <a href={`/blog/${latestBlog.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📝 সর্বশেষ ব্লগ</h3>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{latestBlog.title}</h4>
            <small style={{ color: '#666' }}>
              {latestBlog.user_name} • {getRelativeTime(latestBlog.created_at)}
            </small>
          </div>
        </a>
      )}

      {topQuestion && (
        <a href="/forum" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>❓ সর্বশেষ প্রশ্ন</h3>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{topQuestion.title}</h4>
            <small style={{ color: '#666' }}>
              {topQuestion.user_name} • {getRelativeTime(topQuestion.created_at)}
            </small>
          </div>
        </a>
      )}
    </div>
  );
}
