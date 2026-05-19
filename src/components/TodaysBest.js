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

  const fetchData = async () => {
    try {
      const todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // আজকের সর্বোচ্চ দাম
      const { data: price } = await supabase
        .from('agent_prices')
        .select('*')
        .eq('approved', true)
        .gte('created_at', todayStart)
        .order('price', { ascending: false })
        .limit(1)
        .maybeSingle();
      setTopPrice(price);

      // সর্বশেষ ব্লগ
      const { data: blog } = await supabase
        .from('blogs')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestBlog(blog);

      // সর্বশেষ প্রশ্ন
      const { data: question } = await supabase
        .from('forum_questions')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setTopQuestion(question);
    } catch (err) {
      console.warn('TodaysBest fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // প্রতি ১ মিনিটে রিফ্রেশ
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <div className="card-grid">
      {topPrice && (
        <div className="feature-card">
          <h3>🔥 আজকের সর্বোচ্চ দাম</h3>
          <p><strong>{topPrice.crop}</strong> — {topPrice.price} টাকা</p>
          <small>{topPrice.area}, {topPrice.district}</small>
        </div>
      )}
      {latestBlog && (
        <Link href="/blog" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-card">
            <h3>📝 সর্বশেষ ব্লগ</h3>
            <h4>{latestBlog.title}</h4>
            <small>{latestBlog.user_name} • {getRelativeTime(latestBlog.created_at)}</small>
          </div>
        </Link>
      )}
      {topQuestion && (
        <div className="feature-card">
          <h3>❓ সর্বশেষ প্রশ্ন</h3>
          <Link href="/forum"><h4>{topQuestion.title}</h4></Link>
          <small>{topQuestion.user_name} • {getRelativeTime(topQuestion.created_at)}</small>
        </div>
      )}
    </div>
  );
}
