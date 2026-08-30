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
  const [success, setSuccess] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Supabase recovery লিংক থেকে type=recovery ধরা
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('type') === 'recovery') {
      setResetMode(true);
    }
  }, []);

  // ✅ Site URL – প্রোডাকশনে ঠিকঠাক কাজ করবে
  const getSiteUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') {
        return 'http://localhost:3000';
      }
      return 'https://www.krishipath.com';
    }
    return 'https://www.krishipath.com';
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Password reset mode
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

    // Register mode
    if (mode === 'register') {
      const { data, error: regErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, role },
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });

      if (regErr) {
        setError(regErr.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').insert([
          { id: data.user.id, name, phone, role, email },
        ]);

        // Email verification required
        if (!data.session) {
          setVerificationSent(true);
          setLoading(false);
          return;
        }

        alert('রেজিস্ট্রেশন সফল! এখন লগইন করুন।');
        router.push(`/auth?mode=login&redirect=${encodeURIComponent(redirectTo)}`);
      }
    } else {
      // Login mode
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
    if (!resetEmail) {
      setError('ইমেইল দিন');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${getSiteUrl()}/auth?mode=reset`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
      setTimeout(() => router.push('/auth?mode=login'), 2000);
    }
  };

  // ইমেইল ভেরিফিকেশন মেসেজ
  if (verificationSent) {
    return (
      <div className="auth-container">
        <div className="form-card">
          <h2>ইমেইল ভেরিফিকেশন প্রয়োজন</h2>
          <p style={{ textAlign: 'center', margin: '1rem 0' }}>
            আমরা <strong>{email}</strong> ঠিকানায় একটি ভেরিফিকেশন লিংক পাঠিয়েছি।
            অনুগ্রহ করে আপনার ইমেইল চেক করুন এবং লিংকে ক্লিক করে অ্যাকাউন্ট ভেরিফাই করুন।
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
            ইমেইল না পেয়ে থাকলে স্প্যাম ফোল্ডার দেখুন।
          </p>
          <Link href="/auth?mode=login" className="btn btn-primary w-100 mt-3">
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    );
  }

  // পাসওয়ার্ড রিসেট মোড
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

  // স্বাভাবিক লগইন / রেজিস্টার / ফরগট
  return (
    <div className="auth-container">
      <div className="form-card">
        <h2>{showForgot ? 'পাসওয়ার্ড রিসেট' : mode === 'login' ? 'লগইন' : 'রেজিস্টার'}</h2>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {!showForgot ? (
          <>
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

            {/* Google Sign-In */}
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <hr style={{ flex: 1 }} />
                <span style={{ fontSize: '0.9rem', color: '#888' }}>অথবা</span>
                <hr style={{ flex: 1 }} />
              </div>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="btn btn-outline w-100"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Google দিয়ে চালিয়ে যান
              </button>
            </div>
          </>
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
