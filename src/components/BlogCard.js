'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { getRelativeTime } from '@/lib/relativeTime';

export default function BlogCard({ blog }) {
  const { user, supabase } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let channel;
    const fetchLikes = async () => {
      try {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('item_type', 'blog')
          .eq('item_id', blog.id);
        setLikeCount(count || 0);

        if (user) {
          const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('item_type', 'blog')
            .eq('item_id', blog.id)
            .limit(1)
            .maybeSingle();
          setLiked(!!data);
        }
      } catch (err) {
        console.warn('Blog like fetch error:', err.message);
      }
    };

    fetchLikes();

    try {
      channel = supabase
        .channel(`blog-likes-${blog.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'likes', filter: `item_type=eq.blog&item_id=eq.${blog.id}` },
          () => fetchLikes()
        )
        .subscribe();
    } catch (err) {
      console.warn('Blog like subscription failed:', err.message);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [blog.id, user, supabase]);

  const toggleLike = async () => {
    if (!user) {
      alert('লাইক দিতে লগইন করুন।');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'blog')
          .eq('item_id', blog.id);
      } else {
        await supabase.from('likes').insert({
          user_id: user.id,
          item_type: 'blog',
          item_id: blog.id,
        });
      }
    } catch (err) {
      console.error('Toggle like error:', err.message);
      alert('লাইক দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  const previewContent = blog.content?.length > 300 
    ? blog.content.slice(0, 300) + '...' 
    : blog.content;

  return (
    <div className="feature-card" style={{ textAlign: 'left' }}>
      <Link href={`/blog/${blog.id}`} prefetch={false} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{blog.title}</h4>
      </Link>
      <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
        {blog.category} — {blog.user_name} • {getRelativeTime(blog.created_at)}
      </small>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
        {previewContent}
      </div>
      {blog.content?.length > 300 && (
        <Link 
          href={`/blog/${blog.id}`} 
          style={{ 
            color: 'var(--primary)', 
            fontWeight: 600, 
            fontSize: '0.9rem',
            display: 'inline-block',
            marginTop: '0.5rem',
            textDecoration: 'underline'
          }}
        >
          বিস্তারিত পড়ুন →
        </Link>
      )}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleLike}
          disabled={loading}
        >
          <i className={`${liked ? 'fas' : 'far'} fa-heart`}></i> {likeCount}
        </button>
      </div>
    </div>
  );
}
