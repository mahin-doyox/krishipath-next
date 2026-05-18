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
    localStorage.setItem('krishipath_darkmode', next);
  };

  return (
    <button
      className="btn btn-sm"
      onClick={toggle}
      style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
