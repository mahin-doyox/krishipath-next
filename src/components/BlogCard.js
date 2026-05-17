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
    const fetchLikes = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('item_type', 'blog')
        .eq('item_id', blog.id);
      setLikeCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('item_type', 'blog')
          .eq('item_id', blog.id)
          .single();
        setLiked(!!data);
      }
    };
    fetchLikes();

    const channel = supabase
      .channel(`blog-likes-${blog.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `item_type=eq.blog&item_id=eq.${blog.id}` },
        () => fetchLikes()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [blog.id, user, supabase]);

  const toggleLike = async () => {
    if (!user) return alert('লাইক দিতে লগইন করুন।');
    if (loading) return;
    setLoading(true);

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
    setLoading(false);
  };

  return (
    <div className="feature-card" style={{ textAlign: 'left' }}>
      <Link href={`/blog/${blog.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h4>{blog.title}</h4>
      </Link>
      <small>{blog.category} — {blog.user_name} • {getRelativeTime(blog.created_at)}</small>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>{blog.content}</div>
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
