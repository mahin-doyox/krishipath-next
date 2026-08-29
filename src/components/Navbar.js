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
    const interval = setInterval(getCount, 60000);

    const onFocus = () => getCount();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'হোম', icon: 'fa-home', path: '/' },
    { href: '/blog', label: 'ব্লগ', icon: 'fa-newspaper', path: '/blog' },
    { href: '/forum', label: 'প্রশ্নোত্তর', icon: 'fa-comments', path: '/forum' },
    { href: '/bazar', label: 'কৃষিবাজার', icon: 'fa-store', path: '/bazar' },
    { href: '/prices', label: 'বাজার দর', icon: 'fa-chart-line', path: '/prices' },
    { href: '/crop-disease', label: '🧪 রোগ নির্ণয়', icon: 'fa-microscope', path: '/crop-disease' },
    { href: '/crop-chat', label: '💬 কৃষি চ্যাট', icon: 'fa-robot', path: '/crop-chat' },
  ];

  return (
    <>
      {/* TOP BAR */}
      <nav className="navbar">
        <div className="logo" onClick={() => (window.location.href = '/')}>
          <img
            src="https://i.ibb.co.com/N2fHrxQd/Screenshot-2026-05-09-1-50-43-PM-removebg-preview.png"
            alt="কৃষিপথ লোগো"
          />
          <div className="logo-text">
            কৃষিপথ <span>• krishipath</span>
          </div>
        </div>

        <div className="header-actions">
          <DarkModeToggle />
          {user && (
            <div
              className="notification-badge"
              onClick={() => (window.location.href = '/profile')}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <i className="fas fa-bell" style={{ fontSize: '1.3rem', color: 'var(--primary)' }}></i>
              {notifCount > 0 && (
                <span
                  className="count"
                  style={{
                    display: 'flex',
                    position: 'absolute',
                    top: '-8px',
                    right: '-10px',
                    background: '#e53935',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
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

      {/* DESKTOP NAV LINKS */}
      <div className="desktop-nav">
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.path ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
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

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.path ? 'active' : ''}
          >
            <i className={`fas ${link.icon}`}></i>
            <span>{link.label}</span>
          </Link>
        ))}
        {user && (
          <>
            <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
              <i className="fas fa-user"></i>
              <span>প্রোফাইল</span>
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                <i className="fas fa-shield-alt"></i>
                <span>অ্যাডমিন</span>
              </Link>
            )}
          </>
        )}
      </div>
    </>
  );
}
