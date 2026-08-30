'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user, profile, signOut, supabase } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef(null);

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
          setNotifCount(0);
        } else {
          setNotifCount(count || 0);
        }
      } catch (err) {
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

  // বাইরে ক্লিক করলে "আরো" মেনু বন্ধ
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // প্রধান ৪টি লিংক
  const mainLinks = [
    { href: '/', label: 'হোম', icon: 'fa-home' },
    { href: '/prices', label: 'বাজার দর', icon: 'fa-chart-line' },
    { href: '/bazar', label: 'কৃষিবাজার', icon: 'fa-store' },
    { href: '/forum', label: 'প্রশ্নোত্তর', icon: 'fa-comments' },
  ];

  // আরো মেনুর লিংক
  const moreLinks = [
    { href: '/blog', label: 'ব্লগ', icon: 'fa-newspaper' },
    { href: '/crop-disease', label: 'রোগ নির্ণয়', icon: 'fa-microscope' },
    { href: '/crop-chat', label: 'কৃষি চ্যাট', icon: 'fa-robot' },
    { href: '/my-crops', label: 'আমার ফসল', icon: 'fa-seedling' },
    { href: '/profile', label: 'প্রোফাইল', icon: 'fa-user' },
  ];

  if (user && profile?.role === 'admin') {
    moreLinks.push({ href: '/admin', label: 'অ্যাডমিন', icon: 'fa-shield-alt' });
  }

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
                <Link href="/auth" className="btn btn-outline btn-sm">লগইন</Link>
                <Link href="/auth?mode=register" className="btn btn-primary btn-sm">রেজিস্টার</Link>
              </>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>লগআউট</button>
            )}
          </div>
        </div>
      </nav>

      {/* DESKTOP NAV */}
      <div className="desktop-nav">
        <div className="nav-links">
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}>
              {link.label}
            </Link>
          ))}

          {/* আরো ড্রপডাউন */}
          <div style={{ position: 'relative' }} ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: moreOpen ? 'var(--gold)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              আরো <i className={`fas fa-chevron-${moreOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem' }}></i>
            </button>

            {moreOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '180px',
                  zIndex: 1000,
                  padding: '0.5rem',
                }}
              >
                {moreLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: 'block',
                      padding: '0.6rem 1rem',
                      textDecoration: 'none',
                      color: 'var(--primary)',
                      fontWeight: 500,
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        {mainLinks.map(link => (
          <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}>
            <i className={`fas ${link.icon}`}></i>
            <span>{link.label}</span>
          </Link>
        ))}

        {/* আরো ড্রপডাউন (মোবাইল) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#888',
            }}
          >
            <i className="fas fa-bars"></i>
            <span>আরো</span>
          </button>

          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '50px',
                right: 0,
                background: 'white',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '160px',
                zIndex: 1000,
                padding: '0.5rem',
              }}
            >
              {moreLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    textDecoration: 'none',
                    color: 'var(--primary)',
                    fontWeight: 500,
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className={`fas ${link.icon}`} style={{ fontSize: '1rem' }}></i>
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
