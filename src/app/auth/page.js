'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      const { data, error: regErr } = await supabase.auth.signUp({ email, password });
      if (regErr) return setError(regErr.message);
      if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, name, phone, role, email }]);
        alert('রেজিস্ট্রেশন সফল! এখন লগইন করুন।');
        router.push('/auth?mode=login');
      }
    } else {
      const { data, error: logErr } = await supabase.auth.signInWithPassword({ email, password });
      if (logErr) return setError(logErr.message);
      router.push('/');
    }
  };

  const handleReset = async () => {
    if (!resetEmail) return setError('ইমেইল দিন');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin + '/?reset=true' });
    if (error) setError(error.message);
    else { alert('রিসেট লিংক পাঠানো হয়েছে।'); router.push('/auth?mode=login'); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div className="form-card" style={{ maxWidth: '520px', width: '100%' }}>
        <h2>{showForgot ? 'পাসওয়ার্ড রিসেট' : mode === 'login' ? 'লগইন' : 'রেজিস্টার'}</h2>
        {error && <p className="alert-danger">{error}</p>}
        {!showForgot ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>ইমেইল</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>পাসওয়ার্ড</label><input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            {mode === 'register' && (
              <>
                <div className="form-group"><label>নাম</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div className="form-group"><label>ফোন নম্বর</label><input type="tel" className="form-control" placeholder="+8801XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <div className="form-group"><label>রোল</label>
                  <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="farmer">কৃষক</option>
                    <option value="businessman">ব্যবসায়ী</option>
                    <option value="agent">এজেন্ট</option>
                    <option value="expert">কৃষিবিদ</option>
                  </select>
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary w-100">সাবমিট</button>
          </form>
        ) : (
          <div>
            <p>আপনার ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাবো।</p>
            <div className="form-group"><label>ইমেইল</label><input type="email" className="form-control" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required /></div>
            <button className="btn btn-primary w-100" onClick={handleReset}>রিসেট লিংক পাঠান</button>
          </div>
        )}
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          {!showForgot ? (
            <>
              <Link href={`/auth?mode=${mode === 'login' ? 'register' : 'login'}`}>{mode === 'login' ? 'রেজিস্টার করুন' : 'লগইন করুন'}</Link> |{' '}
              <a href="#" onClick={() => setShowForgot(true)}>পাসওয়ার্ড ভুলে গেছেন?</a>
            </>
          ) : (
            <Link href="/auth?mode=login" onClick={() => setShowForgot(false)}>← লগইনে ফিরুন</Link>
          )}
        </p>
      </div>
    </div>
  );
}