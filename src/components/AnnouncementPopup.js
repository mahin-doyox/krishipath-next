'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementPopup({ message }) {
  const [show, setShow] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (message) setShow(true);
    // ডার্ক মোড চেক
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setDark(isDark);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newDark = document.documentElement.getAttribute('data-theme') === 'dark';
          setDark(newDark);
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [message]);

  if (!show || !message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: dark ? '#1a1d22' : 'white',
          color: dark ? '#e2e2e2' : '#0a1f1a',
          padding: '2rem',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h3 style={{ color: dark ? '#f5e56c' : 'var(--primary)' }}>📢 ঘোষণা</h3>
        <p style={{ margin: '1.5rem 0', fontSize: '1.2rem' }}>{message}</p>
        <button
          className="btn btn-primary"
          onClick={() => setShow(false)}
          style={{ background: dark ? '#f5e56c' : 'var(--primary)', color: dark ? '#0d0f12' : 'white' }}
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}
