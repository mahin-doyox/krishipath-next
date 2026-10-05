'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

// ইমেইলের রিসেট লিংকে ক্লিক করলে /auth/callback সেশন বানিয়ে এই পেজে পাঠায়।
export default function ResetPasswordPage() {
  const { supabase } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data?.user);
      setReady(true);
    });
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
    if (password !== confirm) return setError('দুটি পাসওয়ার্ড মেলেনি');

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(err.message);

    setDone(true);
    await supabase.auth.signOut();                       // নতুন পাসওয়ার্ড দিয়ে আবার লগইন করাই নিরাপদ
    setTimeout(() => router.push('/auth?mode=login'), 2000);
  };

  if (!ready) return <div className="auth-container"><p style={{ textAlign: 'center' }}>লোড হচ্ছে...</p></div>;

  return (
    <div className="auth-container">
      <div className="form-card">
        <h2>নতুন পাসওয়ার্ড দিন</h2>

        {done ? (
          <p style={{ textAlign: 'center', color: 'green', margin: '1rem 0' }}>
            ✅ পাসওয়ার্ড বদলানো হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন...
          </p>
        ) : !hasSession ? (
          <>
            <p style={{ textAlign: 'center', margin: '1rem 0' }}>
              রিসেট লিংকটি মেয়াদোত্তীর্ণ বা সঠিক নয়। লিংকটি যে ফোন/ব্রাউজারে অনুরোধ করেছিলেন সেখানেই খুলতে হবে।
              আবার নতুন লিংক চেয়ে নিন।
            </p>
            <Link href="/auth?mode=login" className="btn btn-primary w-100">লগইন পেজে যান</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>নতুন পাসওয়ার্ড</label>
              <input className="form-control" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            </div>
            <div className="form-group">
              <label>পাসওয়ার্ড আবার লিখুন</label>
              <input className="form-control" type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            </div>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড বদলান'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
