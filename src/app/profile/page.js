'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return router.push('/');
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setNotifs(data || []));
    // Mark as read
    supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then(() => {});
  }, [user]);

  if (!user) return <div className="container" style={{padding:'2rem'}}>লোডিং...</div>;

  return (
    <div className="form-card">
      <h2>আমার প্রোফাইল</h2>
      <p><strong>নাম:</strong> {profile?.name || ''}</p>
      <p><strong>ইমেইল:</strong> {user.email}</p>
      <p><strong>ফোন:</strong> {profile?.phone || 'N/A'}</p>
      <p><strong>রোল:</strong> {profile?.role || 'farmer'}</p>
      <h3 style={{ marginTop: '2rem' }}>নোটিফিকেশন (সর্বশেষ ৩টি)</h3>
      {notifs.length > 0 ? notifs.map(n => (
        <p key={n.id}>🔔 {n.message} <small>{new Date(n.created_at).toLocaleString()}</small></p>
      )) : <p>কোনো নোটিফিকেশন নেই</p>}
    </div>
  );
}