'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getRelativeTime } from '@/lib/relativeTime';

export default function ProfilePage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth?mode=login&redirect=/profile');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('id,user_id,message,read,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setNotifs(data || []);

        // Mark as read
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      } catch (err) {
        console.error('Notification fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, router, supabase]);

  if (!user) return null;

  const roleLabels = {
    farmer: 'কৃষক',
    businessman: 'ব্যবসায়ী',
    agent: 'এজেন্ট',
    expert: 'কৃষিবিদ',
    admin: 'অ্যাডমিন',
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div className="form-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 auto 0.8rem',
            }}
          >
            {profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin: 0 }}>{profile?.name || 'কৃষিপথ সদস্য'}</h2>
          <p style={{ color: '#666', margin: '0.3rem 0' }}>{roleLabels[profile?.role] || 'কৃষক'}</p>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <div className="profile-info-row">
            <span className="profile-info-label">ইমেইল</span>
            <span className="profile-info-value">{user.email}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">ফোন</span>
            <span className="profile-info-value">{profile?.phone || 'যোগ করা হয়নি'}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">রোল</span>
            <span className="profile-info-value">{roleLabels[profile?.role] || 'কৃষক'}</span>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🔔 নোটিফিকেশন</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>লোড হচ্ছে...</p>
        ) : notifs.length > 0 ? (
          notifs.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '0.7rem',
                borderRadius: '12px',
                background: n.read ? 'transparent' : '#f0f7f0',
                marginBottom: '0.5rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.95rem' }}>🔔 {n.message}</p>
              <small style={{ color: '#888' }}>
                {getRelativeTime(n.created_at)}
              </small>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>কোনো নোটিফিকেশন নেই</p>
        )}
      </div>
    </div>
  );
}
