'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user, profile, signOut, supabase } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    const getCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setNotifCount(count || 0);
    };
    getCount();

    const channel = supabase
      .channel('notif-count')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => setNotifCount((prev) => prev + 1))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, supabase]);

  const handleLogout = async () => { await signOut(); };

  return (
    <nav className="navbar">
      {/* লোগো (ডেস্কটপে দেখাবে) */}
      <div className="logo" onClick={() => window.location.href = '/'}>
        <img src="https://i.ibb.co.com/N2fHrxQd/Screenshot-2026-05-09-1-50-43-PM-removebg-preview.png" alt="logo" />
        <div className="logo-text">কৃষিপথ <span>• krishipath</span></div>
      </div>

      {/* মোবাইল মেনু টগল (এখন দরকার নেই, তবে রাখা আছে) */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          <i className="fas fa-home" style={{fontSize:'1.2rem'}}></i> হোম
        </Link>
        <Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''}>
          <i className="fas fa-newspaper" style={{fontSize:'1.2rem'}}></i> ব্লগ
        </Link>
        <Link href="/forum" className={pathname === '/forum' ? 'active' : ''}>
          <i className="fas fa-comments" style={{fontSize:'1.2rem'}}></i> ফোরাম
        </Link>
        <Link href="/bazar" className={pathname === '/bazar' ? 'active' : ''}>
          <i className="fas fa-store" style={{fontSize:'1.2rem'}}></i> বাজার
        </Link>
        <Link href="/prices" className={pathname === '/prices' ? 'active' : ''}>
          <i className="fas fa-chart-line" style={{fontSize:'1.2rem'}}></i> দর
        </Link>

        {user && (
          <>
            <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
              <i className="fas fa-user" style={{fontSize:'1.2rem'}}></i> প্রোফাইল
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                <i className="fas fa-shield-alt" style={{fontSize:'1.2rem'}}></i> অ্যাডমিন
              </Link>
            )}
            {/* নোটিফিকেশন বেল */}
            <div className="notification-badge" onClick={() => window.location.href='/profile'}>
              <i className="fas fa-bell" style={{fontSize:'1.3rem', color:'var(--primary)'}}></i>
              {notifCount > 0 && <span className="count" style={{display:'flex'}}>{notifCount}</span>}
            </div>
          </>
        )}

        {/* ডেস্কটপে লগইন/আউট বাটন */}
        <div className="auth-buttons">
          {!user ? (
            <>
              <Link href="/auth" className="btn btn-outline btn-sm">লগইন</Link>
              <Link href="/auth?mode=register" className="btn btn-primary btn-sm">রেজিস্টার</Link>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>লগআউট</button>
          )}
        </div>
      </div>
    </nav>
  );
}
