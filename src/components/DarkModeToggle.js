'use client';
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('krishipath_darkmode');
    if (stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('krishipath_darkmode', String(next));
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'লাইট মোডে যান' : 'ডার্ক মোডে যান'}
      title={dark ? 'লাইট মোড' : 'ডার্ক মোড'}
      style={{
        background: 'transparent',
        border: 'none',
        fontSize: '1.4rem',
        cursor: 'pointer',
        padding: '0.4rem',
        borderRadius: '50%',
        transition: 'transform 0.3s ease, background 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
