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
      maxWidth: '700px',
      margin: '0 auto',
      padding: '1rem 1rem 0',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      <h2 className="section-title" style={{ fontSize: '1.6rem', marginBottom: '1rem', flexShrink: 0 }}>
        💬 কৃষি পরামর্শ চ্যাট
      </h2>

      {!user && (
        <div style={{ flexShrink: 0 }}>
          <div className="form-card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p>⚠️ এই ফিচারটি ব্যবহার করতে লগইন করুন।</p>
            <Link href={`/auth?mode=login&redirect=${encodeURIComponent('/crop-chat')}`} className="btn btn-primary btn-sm">
              লগইন / রেজিস্টার
            </Link>
          </div>
        </div>
      )}

      {/* চ্যাট মেসেজ এরিয়া — পুরো পেজ স্ক্রল করবে */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingBottom: '1rem',
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

      {/* ইনপুট এরিয়া — sticky, নিচে স্থির */}
      {user && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: '#f2f9f2',
            paddingTop: '0.8rem',
            paddingBottom: '0.8rem',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="রোগের নাম লিখুন..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '2px solid #d1e7dd',
              fontSize: '16px',
              outline: 'none',
              background: 'white',
              color: 'var(--primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            style={{
              padding: '10px 16px',
              borderRadius: '24px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {loading ? '•••' : 'পাঠান'}
          </button>
        </div>
      )}
      {error && (
        <p style={{ color: 'red', textAlign: 'center', flexShrink: 0, marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  );
}
