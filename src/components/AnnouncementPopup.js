'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementPopup({ message }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
    }
  }, [message]);

  if (!show || !message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: '24px', maxWidth: '500px', width: '90%',
        textAlign: 'center', boxShadow: 'var(--shadow-lg)'
      }}>
        <h3>📢 ঘোষণা</h3>
        <p style={{ margin: '1.5rem 0', fontSize: '1.2rem' }}>{message}</p>
        <button className="btn btn-primary" onClick={() => setShow(false)}>বন্ধ করুন</button>
      </div>
    </div>
  );
}