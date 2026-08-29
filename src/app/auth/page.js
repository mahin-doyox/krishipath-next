'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const redirectTo = searchParams.get('redirect') || '/';
  const router = useRouter();
  const { supabase } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('farmer');
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('type') === 'recovery') {
      setResetMode(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (resetMode) {
      const { error: resetErr } = await supabase.auth.updateUser({ password });
      if (resetErr) {
        setError(resetErr.message);
        setLoading(false);
        return;
      }
      setResetCompleted(true);
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    if (mode === 'register') {
      const { data, error: regErr } = await supabase.auth.signUp({ email, password });
      if (regErr) {
        setError(regErr.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, name, phone, role, email }]);
        alert('রেজিস্ট্রেশন সফল! এখন লগইন করুন।');
        router.push(`/auth?mode=login&redirect=${encodeURIComponent(redirectTo)}`);
      }
    } else {
      const { error: logErr } = await supabase.auth.signInWithPassword({ email, password });
      if (logErr) {
        setError(logErr.message);
        setLoading(false);
        return;
      }
      router.push(redirectTo);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!resetEmail) return setError('ইমেইল দিন');
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else { alert('রিসেট লিংক পাঠানো হয়েছে।'); router.push('/auth?mode=login'); }
  };

  if (resetMode) {
    return (
      <div className="auth-container">
        <div className="form-card">
          <h2>নতুন পাসওয়ার্ড সেট করুন</h2>
          {resetCompleted ? (
            <p className="success-message">✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। হোম পেজে ফিরুন...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'সেট হচ্ছে...' : 'সেট করুন'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="form-card">
        <h2>{showForgot ? 'পাসওয়ার্ড রিসেট' : mode === 'login' ? 'লগইন' : 'রেজিস্টার'}</h2>
        {error && <p className="error-text">{error}</p>}
        {!showForgot ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ইমেইল</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>পাসওয়ার্ড</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>নাম</label>
                  <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>ফোন নম্বর</label>
                  <input type="tel" className="form-control" placeholder="+8801XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>রোল</label>
                  <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="farmer">কৃষক</option>
                    <option value="businessman">ব্যবসায়ী</option>
                    <option value="agent">এজেন্ট</option>
                    <option value="expert">কৃষিবিদ</option>
                  </select>
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'অপেক্ষা করুন...' : 'সাবমিট'}
            </button>
          </form>
        ) : (
          <div>
            <p>আপনার ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাবো।</p>
            <div className="form-group">
              <label>ইমেইল</label>
              <input type="email" className="form-control" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary w-100" onClick={handleReset} disabled={loading}>
              {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
            </button>
          </div>
        )}
        <p className="auth-links">
          {!showForgot ? (
            <>
              <Link href={`/auth?mode=${mode === 'login' ? 'register' : 'login'}&redirect=${encodeURIComponent(redirectTo)}`}>
                {mode === 'login' ? 'রেজিস্টার করুন' : 'লগইন করুন'}
              </Link>
              {' | '}
              <a href="#" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>পাসওয়ার্ড ভুলে গেছেন?</a>
            </>
          ) : (
            <Link href="/auth?mode=login" onClick={() => setShowForgot(false)}>← লগইনে ফিরুন</Link>
          )}
        </p>
      </div>
    </div>
  );
}
