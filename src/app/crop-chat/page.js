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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '700px',
      margin: '0 auto',
      background: '#f2f9f2',
      zIndex: 500,
    }}>
      {/* হেডার */}
      <div style={{ padding: '1rem 1rem 0.5rem', flexShrink: 0 }}>
        <h2 className="section-title" style={{ fontSize: '1.6rem', margin: 0 }}>
          💬 কৃষি পরামর্শ চ্যাট
        </h2>
      </div>

      {!user && (
        <div style={{ padding: '0 1rem', flexShrink: 0 }}>
          <div className="form-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p>⚠️ এই ফিচারটি ব্যবহার করতে লগইন করুন।</p>
            <Link href={`/auth?mode=login&redirect=${encodeURIComponent('/crop-chat')}`} className="btn btn-primary btn-sm">
              লগইন / রেজিস্টার
            </Link>
          </div>
        </div>
      )}

      {/* চ্যাট মেসেজ এরিয়া */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
        }}
      >
        {chats.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '4rem', padding: '0 1rem' }}>
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
                  maxWidth: '80%',
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
                  maxWidth: '80%',
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

      {/* ইনপুট এরিয়া — নিচের নেভের জন্য জায়গা রেখে */}
      {user && (
        <div
          style={{
            flexShrink: 0,
            padding: '0.8rem 1rem',
            // মোবাইলে নিচের নেভের উচ্চতা ≈ 70-80px + কিছু মার্জিন
            paddingBottom: 'calc(0.8rem + 80px)',
            background: '#f2f9f2',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
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
              fontSize: '16px', // মোবাইলে 16px গুরুত্বপূর্ণ
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
              padding: '12px 18px',
              borderRadius: '25px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '0.9rem',
            }}
          >
            {loading ? '...' : 'পাঠান'}
          </button>
        </div>
      )}
      {error && (
        <p style={{ color: 'red', padding: '0 1rem 0.5rem', textAlign: 'center', flexShrink: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
