'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getRelativeTime } from '@/lib/relativeTime';

const ROLES = {
  farmer: { label: 'কৃষক', icon: '🌾' },
  businessman: { label: 'ব্যবসায়ী', icon: '🏪' },
  agent: { label: 'এজেন্ট', icon: '📊' },
  expert: { label: 'কৃষিবিদ', icon: '🎓' },
  admin: { label: 'অ্যাডমিন', icon: '🛡️' },
};

const SHORTCUTS = [
  { href: '/crop-disease', icon: '🔍', label: 'রোগ নির্ণয়' },
  { href: '/crop-chat', icon: '💬', label: 'কৃষি চ্যাট' },
  { href: '/my-crops', icon: '🌱', label: 'আমার ফসল' },
  { href: '/fertilizer', icon: '🧮', label: 'সার হিসাব' },
];

const PAGE = 8;
const soft = 'rgba(127,127,127,0.12)';
const bn = (n) => Number(n || 0).toLocaleString('bn-BD');
const notifChanged = () => window.dispatchEvent(new Event('notifs-changed')); // Navbar-এর ব্যাজ সাথে সাথে আপডেট হবে

export default function ProfilePage() {
  const { user, profile, supabase, fetchProfile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [extra, setExtra] = useState({ bio: '', requested_role: null, scans: 0, chats: 0, plans: 0, tasks: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [notifs, setNotifs] = useState([]);
  const [nLoading, setNLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?mode=login&redirect=/profile');
  }, [authLoading, user, router]);

  const loadExtra = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, বাংলাদেশের স্থানীয় তারিখ
      const count = (table) => supabase.from(table).select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const [me, scans, chats, plans] = await Promise.all([
        supabase.from('profiles').select('bio,requested_role').eq('id', user.id).maybeSingle(),
        count('crop_scans'),
        count('crop_chats'),
        supabase.from('crop_plans').select('id').eq('user_id', user.id).eq('status', 'active'),
      ]);
      let tasks = 0;
      const ids = (plans.data || []).map((p) => p.id);
      if (ids.length) {
        const t = await supabase.from('crop_tasks').select('*', { count: 'exact', head: true })
          .in('plan_id', ids).eq('task_date', today).eq('is_completed', false);
        tasks = t.count || 0;
      }
      setExtra({
        bio: me.data?.bio || '',
        requested_role: me.data?.requested_role || null,
        scans: scans.count || 0,
        chats: chats.count || 0,
        plans: ids.length,
        tasks,
      });
    } catch (e) {
      console.error('Profile stats error:', e);
    }
  }, [user, supabase]);

  const loadNotifs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications')
      .select('id,message,read,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    setNotifs(data || []);
    setNLoading(false);
  }, [user, supabase]);

  useEffect(() => { loadExtra(); loadNotifs(); }, [loadExtra, loadNotifs]);

  // ---------- প্রোফাইল সম্পাদনা ----------
  const startEdit = () => {
    setForm({ name: profile?.name || '', phone: profile?.phone || '', bio: extra.bio || '' });
    setMsg('');
    setEditing(true);
  };

  const saveProfile = async () => {
    const name = form.name.trim();
    const phone = form.phone.trim().replace(/[\s-]/g, '');
    if (!name) return setMsg('নাম লিখুন');
    if (phone && !/^(\+?88)?01[3-9]\d{8}$/.test(phone)) return setMsg('সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)');
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ name: name.slice(0, 60), phone: phone || null, bio: form.bio.trim().slice(0, 160) || null })
      .eq('id', user.id);
    setSaving(false);
    if (error) return setMsg('সেভ হয়নি, আবার চেষ্টা করুন');
    await fetchProfile(user.id);
    await loadExtra();
    setEditing(false);
    setMsg('✅ প্রোফাইল সেভ হয়েছে');
  };

  // ---------- নোটিফিকেশন ----------
  const markRead = async (id) => {
    setNotifs((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) loadNotifs(); else notifChanged();
  };
  const markAll = async () => {
    setNotifs((l) => l.map((n) => ({ ...n, read: true })));
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    if (error) loadNotifs(); else notifChanged();
  };
  const remove = async (id) => {
    setNotifs((l) => l.filter((n) => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) loadNotifs(); else notifChanged();
  };
  const clearRead = async () => {
    if (!confirm('পড়া হয়ে গেছে এমন সব নোটিফিকেশন মুছবেন?')) return;
    setNotifs((l) => l.filter((n) => !n.read));
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id).eq('read', true);
    if (error) loadNotifs(); else notifChanged();
  };

  if (!user) return null;

  const role = ROLES[profile?.role] || ROLES.farmer;
  const unread = notifs.filter((n) => !n.read).length;
  const list = (filter === 'unread' ? notifs.filter((n) => !n.read) : notifs);
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long' })
    : null;
  const initial = (profile?.name || user.email || '?').trim().charAt(0).toUpperCase();

  const stats = [
    { icon: '🔍', value: extra.scans, label: 'রোগ স্ক্যান' },
    { icon: '💬', value: extra.chats, label: 'চ্যাট প্রশ্ন' },
    { icon: '🌱', value: extra.plans, label: 'চলমান ফসল' },
    { icon: '✅', value: extra.tasks, label: 'আজকের কাজ' },
  ];

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 2rem', maxWidth: '640px', margin: '0 auto' }}>

      {/* প্রোফাইল কার্ড */}
      <div className="form-card" style={{ textAlign: 'center' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', margin: '0 auto 0.8rem',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          boxShadow: '0 0 0 4px var(--gold)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 700,
        }}>{initial}</div>

        <h2 style={{ margin: 0 }}>{profile?.name || 'কৃষিপথ সদস্য'}</h2>
        <div style={{ display: 'inline-block', margin: '0.5rem 0', padding: '3px 14px', borderRadius: 999, background: 'var(--gold-light)', color: '#5a3e1b', fontWeight: 600, fontSize: '.9rem' }}>
          {role.icon} {role.label}
        </div>
        {extra.requested_role && (
          <p style={{ margin: '0.2rem 0', fontSize: '.85rem', color: '#b45309' }}>
            ⏳ {ROLES[extra.requested_role]?.label || ''} রোলের জন্য যাচাই চলছে
          </p>
        )}
        {extra.bio && <p style={{ margin: '0.5rem 0', opacity: 0.85 }}>{extra.bio}</p>}
        {joined && <small style={{ opacity: 0.65 }}>কৃষিপথের সদস্য: {joined} থেকে</small>}

        {!editing && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={startEdit}>✏️ প্রোফাইল সম্পাদনা</button>
            <button className="btn btn-outline btn-sm" onClick={signOut}>লগআউট</button>
          </div>
        )}
        {msg && !editing && <p style={{ marginTop: 8, fontSize: '.9rem' }}>{msg}</p>}
      </div>

      {/* সম্পাদনা ফর্ম */}
      {editing && (
        <div className="form-card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.8rem' }}>প্রোফাইল সম্পাদনা</h3>
          <div className="form-group">
            <label>নাম</label>
            <input className="form-control" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>মোবাইল নম্বর</label>
            <input className="form-control" inputMode="tel" placeholder="017XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>আমার সম্পর্কে ({bn(form.bio.length)}/১৬০)</label>
            <textarea className="form-control" rows={3} maxLength={160} placeholder="যেমন: রাজশাহীর আম চাষি, ১০ বছরের অভিজ্ঞতা"
              value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <small style={{ opacity: 0.7 }}>ইমেইল ও রোল এখান থেকে বদলানো যায় না।</small>
          {msg && <p style={{ color: '#b91c1c', margin: '0.5rem 0' }}>{msg}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: '0.8rem' }}>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</button>
            <button className="btn btn-outline" onClick={() => { setEditing(false); setMsg(''); }}>বাতিল</button>
          </div>
        </div>
      )}

      {/* পরিসংখ্যান */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: '1rem' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div className="value">{bn(s.value)}</div>
            <div className="trend">{s.label}</div>
          </div>
        ))}
      </div>

      {extra.tasks > 0 && (
        <Link href="/my-crops" style={{ display: 'block', marginTop: 10, padding: '0.8rem 1rem', borderRadius: 16, background: 'var(--gold-light)', color: '#5a3e1b', fontWeight: 600, textAlign: 'center' }}>
          🌱 আজ আপনার {bn(extra.tasks)}টি কাজ বাকি আছে — দেখুন
        </Link>
      )}

      {/* দ্রুত যাওয়ার লিংক */}
      <div className="form-card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.8rem' }}>দ্রুত যান</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} style={{ background: soft, borderRadius: 14, padding: '0.9rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <small>{s.label}</small>
            </Link>
          ))}
        </div>
      </div>

      {/* নোটিফিকেশন */}
      <div className="form-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
          <h3 style={{ margin: 0 }}>🔔 নোটিফিকেশন {unread > 0 && <span style={{ background: 'var(--gold)', color: '#fff', borderRadius: 999, padding: '1px 9px', fontSize: '.8rem' }}>{bn(unread)} নতুন</span>}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAll}>সব পড়া হয়েছে</button>}
            {notifs.some((n) => n.read) && <button className="btn btn-outline btn-sm" onClick={clearRead}>পড়াগুলো মুছুন</button>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
          {[['all', 'সব'], ['unread', 'অপঠিত']].map(([k, label]) => (
            <button key={k} onClick={() => { setFilter(k); setShown(PAGE); }}
              className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-outline'}`}>{label}</button>
          ))}
        </div>

        {nLoading ? (
          <p style={{ textAlign: 'center', opacity: 0.6 }}>লোড হচ্ছে...</p>
        ) : list.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6, padding: '1rem 0' }}>
            {filter === 'unread' ? '🎉 সব নোটিফিকেশন পড়া হয়ে গেছে' : 'এখনো কোনো নোটিফিকেশন নেই'}
          </p>
        ) : (
          <>
            {list.slice(0, shown).map((n) => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.7rem 0.8rem', borderRadius: 12, marginBottom: 6,
                  background: n.read ? 'transparent' : soft, borderLeft: n.read ? '3px solid transparent' : '3px solid var(--gold)',
                  cursor: n.read ? 'default' : 'pointer',
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '.95rem', fontWeight: n.read ? 400 : 600, wordBreak: 'break-word' }}>{n.message}</p>
                  <small style={{ opacity: 0.65 }}>{getRelativeTime(n.created_at)}</small>
                </div>
                <button aria-label="মুছুন" onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.55 }}>✕</button>
              </div>
            ))}
            {list.length > shown && (
              <button className="btn btn-outline btn-sm" style={{ display: 'block', margin: '0.5rem auto 0' }} onClick={() => setShown(shown + PAGE)}>
                আরও দেখুন ({bn(list.length - shown)}টি বাকি)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
