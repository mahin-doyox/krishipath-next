'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user, profile, signOut, supabase } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const getCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        if (error) {
          console.warn('Notification fetch error:', error.message);
          setNotifCount(0);
        } else {
          setNotifCount(count || 0);
        }
      } catch (err) {
        console.warn('Notification fetch exception:', err);
        setNotifCount(0);
      }
    };

    getCount();
    const interval = setInterval(getCount, 60000); // প্রতি ৬০ সেকেন্ডে চেক

    const onFocus = () => getCount();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* ---- TOP BAR ---- */}
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
          <DarkModeToggle />
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

      {/* ---- DESKTOP NAV LINKS ---- */}
      <div className="desktop-nav">
        <div className="nav-links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>হোম</Link>
          <Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''}>ব্লগ</Link>
          <Link href="/forum" className={pathname === '/forum' ? 'active' : ''}>প্রশ্নোত্তর</Link>
          <Link href="/bazar" className={pathname === '/bazar' ? 'active' : ''}>কৃষিবাজার</Link>
          <Link href="/prices" className={pathname === '/prices' ? 'active' : ''}>বাজার দর</Link>
          <Link href="/crop-disease" className={pathname === '/crop-disease' ? 'active' : ''}>🧪 রোগ নির্ণয়</Link>
          <Link href="/crop-chat" className={pathname === '/crop-chat' ? 'active' : ''}>💬 কৃষি চ্যাট</Link>
          {user && (
            <>
              <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>প্রোফাইল</Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>অ্যাডমিন</Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- MOBILE BOTTOM NAV ---- */}
      <div className="mobile-bottom-nav">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          <i className="fas fa-home"></i><span>হোম</span>
        </Link>
        <Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''}>
          <i className="fas fa-newspaper"></i><span>ব্লগ</span>
        </Link>
        <Link href="/forum" className={pathname === '/forum' ? 'active' : ''}>
          <i className="fas fa-comments"></i><span>ফোরাম</span>
        </Link>
        <Link href="/bazar" className={pathname === '/bazar' ? 'active' : ''}>
          <i className="fas fa-store"></i><span>বাজার</span>
        </Link>
        <Link href="/prices" className={pathname === '/prices' ? 'active' : ''}>
          <i className="fas fa-chart-line"></i><span>দর</span>
        </Link>
        <Link href="/crop-disease" className={pathname === '/crop-disease' ? 'active' : ''}>
          <i className="fas fa-microscope"></i><span>রোগ</span>
        </Link>
        <Link href="/crop-chat" className={pathname === '/crop-chat' ? 'active' : ''}>
          <i className="fas fa-robot"></i><span>চ্যাট</span>
        </Link>
        {user && (
          <>
            <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
              <i className="fas fa-user"></i><span>প্রোফাইল</span>
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                <i className="fas fa-shield-alt"></i><span>অ্যাডমিন</span>
              </Link>
            )}
          </>
        )}
      </div>
    </>
  );
}
