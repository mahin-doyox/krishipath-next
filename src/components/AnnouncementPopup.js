'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementPopup({ message }) {
  const [show, setShow] = useState(false);
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      // সামান্য delay দিয়ে অ্যানিমেশন
      setTimeout(() => setVisible(true), 50);
    }
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

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
  };

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
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          background: dark ? '#1a1d22' : 'white',
          color: dark ? '#e2e2e2' : '#0a1f1a',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          borderRadius: '28px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          transform: visible ? 'scale(1)' : 'scale(0.8)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '0.5rem',
          }}
        >
          📢
        </div>
        <h3 style={{ 
          color: dark ? '#f5e56c' : 'var(--primary)', 
          marginBottom: '1rem',
          fontSize: 'clamp(1.2rem, 4vw, 1.5rem)'
        }}>
          ঘোষণা
        </h3>
        <p style={{ 
          margin: '0 0 1.5rem', 
          fontSize: 'clamp(1rem, 3vw, 1.1rem)',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </p>
        <button
          className="btn btn-primary"
          onClick={handleClose}
          style={{ 
            background: dark ? '#f5e56c' : 'var(--primary)', 
            color: dark ? '#0d0f12' : 'white',
            width: '100%',
            maxWidth: '200px',
            margin: '0 auto',
          }}
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}
