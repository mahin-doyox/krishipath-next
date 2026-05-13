'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('blog');
  const [items, setItems] = useState([]);
  const [notifMsg, setNotifMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');

  useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') {
      return router.push('/');
    }
    // EmailJS ইনিশিয়ালাইজ
    if (typeof window !== 'undefined' && window.emailjs) {
      window.emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'kkVuwDNcE67OyBMZS');
    }
    loadTabData();
  }, [tab, user, profile]);

  const loadTabData = async () => {
    let data = [];
    if (tab === 'blog') {
      const { data: d } = await supabase.from('blogs').select('*').eq('approved', false);
      data = d;
    } else if (tab === 'products') {
      const { data: d } = await supabase.from('products').select('*').eq('approved', false);
      data = d;
    } else if (tab === 'prices') {
      const { data: d } = await supabase.from('agent_prices').select('*').eq('approved', false).order('created_at', { ascending: false });
      data = d;
    } else if (tab === 'answers') {
      const { data: d } = await supabase.from('forum_answers').select('*').eq('approved', false).order('created_at', { ascending: false });
      data = d;
    }
    setItems(data || []);
  };

  const approveItem = async (table, id) => {
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    if (!data) return;
    await supabase.from(table).update({ approved: true }).eq('id', id);
    if (data.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: `✅ আপনার কন্টেন্ট (${table}) অনুমোদিত হয়েছে।` }]);
    if (table === 'products') {
      const { data: businessmen } = await supabase.from('profiles').select('id').eq('role', 'businessman');
      if (businessmen) {
        const notifs = businessmen.map(b => ({ user_id: b.id, message: `📢 কৃষিবাজারে নতুন পণ্য: ${data.name}` }));
        await supabase.from('notifications').insert(notifs);
      }
    }
    alert('অনুমোদিত');
    loadTabData();
  };

  const cancelItem = async (table, id) => {
    if (!confirm('বাতিল করতে চান?')) return;
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    if (data?.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: `❌ আপনার কন্টেন্ট (${table}) বাতিল করা হয়েছে।` }]);
    await supabase.from(table).delete().eq('id', id);
    alert('বাতিল করা হয়েছে');
    loadTabData();
  };

  const approveAnswer = async (id) => {
    const { data } = await supabase.from('forum_answers').select('*').eq('id', id).single();
    if (!data) return;
    await supabase.from('forum_answers').update({ approved: true }).eq('id', id);
    if (data.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: '✅ আপনার উত্তর অনুমোদিত হয়েছে।' }]);
    alert('উত্তর অনুমোদিত');
    loadTabData();
  };

  const sendAdminNotification = async () => {
    if (!notifMsg) return alert('মেসেজ লিখুন');
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (profiles) for (let p of profiles) await supabase.from('notifications').insert([{ user_id: p.id, message: '🔔 অ্যাডমিন: ' + notifMsg }]);
    alert('সকলকে নোটিফিকেশন পাঠানো হয়েছে');
    setNotifMsg('');
  };

  const sendEmailToAll = async () => {
    if (!emailMsg) return alert('মেসেজ লিখুন');
    const { data: users } = await supabase.from('profiles').select('email, name');
    if (!users || !users.length) return alert('কোনো ইউজার নেই');
    let count = 0;
    for (let u of users) {
      if (!u.email) continue;
      try {
        await window.emailjs.send('service_d8fivoo', 'template_ftfnh5r', {
          to_email: u.email,
          to_name: u.name || 'কৃষিপথ সদস্য',
          message: emailMsg
        });
        count++;
      } catch (e) {}
    }
    alert(`${count} টি ইমেইল পাঠানো হয়েছে`);
    setEmailMsg('');
  };

  const createAnnouncement = async () => {
    if (!announceMsg) return alert('মেসেজ লিখুন');
    await supabase.from('announcements').delete().neq('id', 0);
    await supabase.from('announcements').insert([{ message: announceMsg }]);
    alert('ঘোষণা সেট হয়েছে');
    setAnnounceMsg('');
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">অ্যাডমিন প্যানেল</h2>
      <div className="admin-tabs">
        {['blog','products','prices','answers','notification','email','announcement'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'blog' ? 'ব্লগ' : t === 'products' ? 'পণ্য' : t === 'prices' ? 'বাজার দর' : t === 'answers' ? 'ফোরাম উত্তর' : t === 'notification' ? '🔔 নোটিফিকেশন' : t === 'email' ? '📧 ইমেইল' : '📢 ঘোষণা'}
          </button>
        ))}
      </div>
      <div>
        {['blog','products','prices'].includes(tab) && items.map(item => (
          <div key={item.id} className="pending-item">
            <div>
              {tab === 'blog' && <><strong>{item.title}</strong> ({item.category}) by {item.user_name}</>}
              {tab === 'products' && <><strong>{item.name}</strong> by {item.user_name}</>}
              {tab === 'prices' && <>{item.division} → {item.district} → {item.upazila} → {item.area}, <strong>{item.crop}</strong>: {item.price} টাকা by {item.user_name}</>}
            </div>
            <div>
              <button className="btn btn-primary btn-sm" onClick={() => approveItem(tab === 'blog' ? 'blogs' : tab === 'products' ? 'products' : 'agent_prices', item.id)}>অনুমোদন</button>
              <button className="btn btn-outline btn-sm" onClick={() => cancelItem(tab === 'blog' ? 'blogs' : tab === 'products' ? 'products' : 'agent_prices', item.id)}>বাতিল</button>
            </div>
          </div>
        ))}
        {tab === 'answers' && items.map(item => (
          <div key={item.id} className="pending-item">
            <div><strong>উত্তর:</strong> {item.answer?.substring(0,100)}... <small>দ্বারা {item.user_name}</small></div>
            <div>
              <button className="btn btn-primary btn-sm" onClick={() => approveAnswer(item.id)}>অনুমোদন</button>
              <button className="btn btn-outline btn-sm" onClick={() => cancelItem('forum_answers', item.id)}>বাতিল</button>
            </div>
          </div>
        ))}
        {tab === 'notification' && (
          <div className="form-card">
            <h3>🔔 সকলকে নোটিফিকেশন পাঠান</h3>
            <textarea className="form-control" value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="মেসেজ"></textarea>
            <button className="btn btn-primary w-100 mt-3" onClick={sendAdminNotification}>পাঠান</button>
          </div>
        )}
        {tab === 'email' && (
          <div className="form-card">
            <h3>📧 সকলকে ইমেইল পাঠান</h3>
            <textarea className="form-control" value={emailMsg} onChange={e => setEmailMsg(e.target.value)} placeholder="মেসেজ"></textarea>
            <button className="btn btn-primary w-100 mt-3" onClick={sendEmailToAll}>ইমেইল পাঠান</button>
          </div>
        )}
        {tab === 'announcement' && (
          <div className="form-card">
            <h3>📢 পপ-আপ ঘোষণা</h3>
            <textarea className="form-control" value={announceMsg} onChange={e => setAnnounceMsg(e.target.value)} placeholder="মেসেজ"></textarea>
            <button className="btn btn-primary w-100 mt-3" onClick={createAnnouncement}>পোস্ট করুন</button>
          </div>
        )}
        {['blog','products','prices','answers'].includes(tab) && items.length === 0 && <p>কোনো পেন্ডিং নেই</p>}
      </div>
    </div>
  );
}