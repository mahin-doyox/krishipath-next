'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user, profile, signOut, supabase } = useAuth();
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setNotifCount((prev) => prev + 1)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* ---- TOP BAR (মোবাইলে উপরে, ডেস্কটপে স্টিকি) ---- */}
      <nav className="navbar">
        <div className="logo" onClick={() => (window.location.href = '/')}>
          <img
            src="https://i.ibb.co.com/N2fHrxQd/Screenshot-2026-05-09-1-50-43-PM-removebg-preview.png"
            alt="লোগো"
          />
          <div className="logo-text">
            কৃষিপথ <span>• krishipath</span>
          </div>
        </div>

        <div className="header-actions">
          {user && (
            <div className="notification-badge" onClick={() => (window.location.href = '/profile')}>
              <i className="fas fa-bell" style={{ fontSize: '1.3rem', color: 'var(--primary)' }}></i>
              {notifCount > 0 && (
                <span className="count" style={{ display: 'flex' }}>
                  {notifCount}
                </span>
              )}
            </div>
          )}
          <div className="auth-buttons">
            {!user ? (
              <>
                <Link href="/auth" className="btn btn-outline btn-sm">
                  লগইন
                </Link>
                <Link href="/auth?mode=register" className="btn btn-primary btn-sm">
                  রেজিস্টার
                </Link>
              </>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                লগআউট
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ---- DESKTOP NAV LINKS (শুধু ডেস্কটপে দৃশ্যমান) ---- */}
      <div className="desktop-nav">
        <div className="nav-links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            হোম
          </Link>
          <Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''}>
            ব্লগ
          </Link>
          <Link href="/forum" className={pathname === '/forum' ? 'active' : ''}>
            প্রশ্নোত্তর
          </Link>
          <Link href="/bazar" className={pathname === '/bazar' ? 'active' : ''}>
            কৃষিবাজার
          </Link>
          <Link href="/prices" className={pathname === '/prices' ? 'active' : ''}>
            বাজার দর
          </Link>
          {user && (
            <>
              <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
                প্রোফাইল
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                  অ্যাডমিন
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- MOBILE BOTTOM NAV (শুধু মোবাইলে) ---- */}
      <div className="mobile-bottom-nav">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          <i className="fas fa-home"></i>
          <span>হোম</span>
        </Link>
        <Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''}>
          <i className="fas fa-newspaper"></i>
          <span>ব্লগ</span>
        </Link>
        <Link href="/forum" className={pathname === '/forum' ? 'active' : ''}>
          <i className="fas fa-comments"></i>
          <span>ফোরাম</span>
        </Link>
        <Link href="/bazar" className={pathname === '/bazar' ? 'active' : ''}>
          <i className="fas fa-store"></i>
          <span>বাজার</span>
        </Link>
        <Link href="/prices" className={pathname === '/prices' ? 'active' : ''}>
          <i className="fas fa-chart-line"></i>
          <span>দর</span>
        </Link>
        {user && (
          <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
            <i className="fas fa-user"></i>
            <span>প্রোফাইল</span>
          </Link>
        )}
      </div>
    </>
  );
}
