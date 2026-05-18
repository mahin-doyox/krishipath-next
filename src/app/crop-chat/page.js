'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendChatMessage, getChatHistory } from '@/app/actions';

export default function CropChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const inputContainerRef = useRef(null);

  // হিস্টরি লোড
  useEffect(() => {
    if (user) {
      getChatHistory(user.id).then(setChats);
    }
  }, [user]);

  // অটো স্ক্রল
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // মোবাইলে নিচের বারকে ফাঁকি দিতে extra bottom space
  const [bottomNavHeight, setBottomNavHeight] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobileNav = document.querySelector('.mobile-bottom-nav');
      if (mobileNav) {
        setBottomNavHeight(mobileNav.offsetHeight + 10); // 10px extra
      } else {
        setBottomNavHeight(0);
      }
    }
  }, []);

  const handleSend = async () => {
    if (!user) {
      router.push(`/auth?mode=login&redirect=${encodeURIComponent('/crop-chat')}`);
      return;
    }
    if (!message.trim()) return;
    setLoading(true);
    setError('');

    const userMsg = message.trim();
    setChats(prev => [...prev, { id: Date.now(), message: userMsg, reply: '...' }]);
    setMessage('');

    const data = await sendChatMessage(user.id, userMsg);

    if (data.error) {
      setError(data.error);
      setChats(prev => prev.filter(c => c.reply !== '...'));
    } else {
      setChats(prev =>
        prev.map(c =>
          c.reply === '...' ? { ...c, reply: data.reply } : c
        )
      );
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '0 1rem',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h2 className="section-title" style={{ fontSize: '1.6rem', margin: '1.5rem 0 1rem' }}>
        💬 কৃষি পরামর্শ চ্যাট
      </h2>

      {!user && (
        <div className="form-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p>⚠️ এই ফিচারটি ব্যবহার করতে লগইন করুন।</p>
          <Link href={`/auth?mode=login&redirect=${encodeURIComponent('/crop-chat')}`} className="btn btn-primary btn-sm">
            লগইন / রেজিস্টার
          </Link>
        </div>
      )}

      {/* চ্যাট মেসেজ এরিয়া */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--white)',
          borderRadius: '20px',
          padding: '1.2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {chats.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '5rem', padding: '0 1rem' }}>
            👋 স্বাগতম! আপনার ফসলের রোগের নাম লিখুন, ওষুধ ও পরামর্শ জানুন।
          </p>
        )}
        {chats.map((chat) => (
          <div key={chat.id}>
            {/* ইউজার মেসেজ */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
              <div
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.7rem 1rem',
                  borderRadius: '18px 18px 4px 18px',
                  maxWidth: '85%',
                  fontSize: '0.95rem',
                  wordBreak: 'break-word',
                }}
              >
                {chat.message}
              </div>
            </div>
            {/* বট রিপ্লাই */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  background: '#e8f5e9',
                  color: 'var(--primary)',
                  padding: '0.7rem 1rem',
                  borderRadius: '18px 18px 18px 4px',
                  maxWidth: '85%',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {chat.reply}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ইনপুট এরিয়া – নিচের বার থেকে দূরে */}
      {user && (
        <div
          ref={inputContainerRef}
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.8rem 0',
            position: 'sticky',
            bottom: `${bottomNavHeight}px`,    // নিচের নেভের উপরে বসবে
            zIndex: 1001,                      // নেভের উপরেই থাকবে
            background: '#f2f9f2',
            borderRadius: '12px',
            marginBottom: '0.5rem',
          }}
        >
          <input
            type="text"
            placeholder="রোগের নাম লিখুন (যেমন: ধানের ব্লাস্ট রোগ)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '25px',
              border: '2px solid #d1e7dd',
              fontSize: '1rem',
              outline: 'none',
              background: 'white',
              color: 'var(--primary)',
              minWidth: 0,
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!message.trim() || loading}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {loading ? '...' : 'পাঠান'}
          </button>
        </div>
      )}
      {error && <p style={{ color: 'red', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}
    </div>
  );
}
