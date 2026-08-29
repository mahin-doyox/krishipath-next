'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const ADMIN_TABS = [
  'blog', 'products', 'prices', 'answers', 'notification', 'email', 'announcement', 'analytics'
];

const TAB_LABELS = {
  blog: 'ব্লগ',
  products: 'পণ্য',
  prices: 'বাজার দর',
  answers: 'ফোরাম উত্তর',
  notification: '🔔 নোটিফিকেশন',
  email: '📧 ইমেইল',
  announcement: '📢 ঘোষণা',
  analytics: '📊 অ্যানালিটিক্স',
};

export default function AdminPage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('blog');
  const [items, setItems] = useState([]);
  const [notifMsg, setNotifMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieInstance = useRef(null);
  const barInstance = useRef(null);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') {
      return router.push('/');
    }
    if (typeof window !== 'undefined' && window.emailjs) {
      window.emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'kkVuwDNcE67OyBMZS');
    }
  }, [user, profile]);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    let data = [];
    if (tab === 'blog') {
      const { data: d } = await supabase.from('blogs').select('id,title,category,user_name').eq('approved', false);
      data = d;
    } else if (tab === 'products') {
      const { data: d } = await supabase.from('products').select('id,name,user_name').eq('approved', false);
      data = d;
    } else if (tab === 'prices') {
      const { data: d } = await supabase.from('agent_prices').select('id,division,district,upazila,area,crop,price,user_name').eq('approved', false).order('created_at', { ascending: false });
      data = d;
    } else if (tab === 'answers') {
      const { data: d } = await supabase.from('forum_answers').select('id,answer,user_name').eq('approved', false).order('created_at', { ascending: false });
      data = d;
    }
    setItems(data || []);
    setLoading(false);
  }, [tab, supabase]);

  useEffect(() => {
    if (tab === 'analytics') {
      loadAnalytics();
    } else {
      loadTabData();
    }
  }, [tab, loadTabData]);

  const loadAnalytics = async () => {
    setLoading(true);
    const [
      { count: totalUsers },
      { count: totalBlogs },
      { count: totalProducts },
      { count: totalQuestions },
      { count: totalPrices },
      { data: roleData },
      { data: priceData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('blogs').select('*', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('forum_questions').select('*', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('agent_prices').select('*', { count: 'exact', head: true }).eq('approved', true),
      supabase.from('profiles').select('role'),
      supabase.from('agent_prices').select('division, price').eq('approved', true)
    ]);

    const roleCounts = {};
    roleData?.forEach(p => {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    });

    const divisionPrices = {};
    const divisionCounts = {};
    priceData?.forEach(p => {
      if (!divisionPrices[p.division]) {
        divisionPrices[p.division] = 0;
        divisionCounts[p.division] = 0;
      }
      divisionPrices[p.division] += p.price;
      divisionCounts[p.division]++;
    });
    const avgPriceByDivision = Object.keys(divisionPrices).map(div => ({
      division: div,
      avg: Math.round(divisionPrices[div] / divisionCounts[div])
    }));

    setAnalytics({ totalUsers, totalBlogs, totalProducts, totalQuestions, totalPrices, roleCounts, avgPriceByDivision });
    setLoading(false);

    setTimeout(() => renderCharts(roleCounts, avgPriceByDivision), 100);
  };

  const renderCharts = (roleCounts, avgPriceByDivision) => {
    if (pieChartRef.current) {
      if (pieInstance.current) pieInstance.current.destroy();
      const ctx = pieChartRef.current.getContext('2d');
      pieInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(roleCounts),
          datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: ['#0d2e1d', '#1b4a30', '#d4a373', '#faedcd', '#64748b']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
        }
      });
    }

    if (barChartRef.current) {
      if (barInstance.current) barInstance.current.destroy();
      const ctx = barChartRef.current.getContext('2d');
      barInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: avgPriceByDivision.map(d => d.division),
          datasets: [{
            label: 'গড় দাম (টাকা)',
            data: avgPriceByDivision.map(d => d.avg),
            backgroundColor: '#0d2e1d'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, title: { display: true, text: 'টাকা' } } },
          plugins: { legend: { display: false } }
        }
      });
    }
  };

  const approveItem = async (table, id) => {
    const { data } = await supabase.from(table).select('*').eq('id', id).single();
    if (!data) return;
    await supabase.from(table).update({ approved: true }).eq('id', id);
    if (data.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: `✅ আপনার কন্টেন্ট (${table}) অনুমোদিত হয়েছে।` }]);
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
    if (data?.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: `❌ আপনার কন্টেন্ট (${table}) বাতিল করা হয়েছে।` }]);
    await supabase.from(table).delete().eq('id', id);
    alert('বাতিল করা হয়েছে');
    loadTabData();
  };

  const approveAnswer = async (id) => {
    const { data } = await supabase.from('forum_answers').select('*').eq('id', id).single();
    if (!data) return;
    await supabase.from('forum_answers').update({ approved: true }).eq('id', id);
    if (data.user_id) await supabase.from('notifications').insert([{ user_id: data.user_id, message: '✅ আপনার উত্তর অনুমোদিত হয়েছে।' }]);
    alert('উত্তর অনুমোদিত');
    loadTabData();
  };

  const sendAdminNotification = async () => {
    if (!notifMsg) return alert('মেসেজ লিখুন');
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (profiles) for (let p of profiles) await supabase.from('notifications').insert([{ user_id: p.id, message: '🔔 অ্যাডমিন: ' + notifMsg }]);
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('কৃষিপথ', { body: '🔔 অ্যাডমিন: ' + notifMsg, icon: '/icon-192.png' });
    }
    alert('সকলকে নোটিফিকেশন পাঠানো হয়েছে');
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
        await window.emailjs.send('service_d8fivoo', 'template_ftfnh5r', { to_email: u.email, to_name: u.name || 'কৃষিপথ সদস্য', message: emailMsg });
        count++;
      } catch (e) {}
    }
    alert(`${count} টি ইমেইল পাঠানো হয়েছে`);
    setEmailMsg('');
  };

  const createAnnouncement = async () => {
    if (!announceMsg) return alert('মেসেজ লিখুন');
    await supabase.from('announcements').delete().neq('id', 0);
    await supabase.from('announcements').insert([{ message: announceMsg }]);
    alert('ঘোষণা সেট হয়েছে');
    setAnnounceMsg('');
  };

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title" style={{ fontSize: 'clamp(1.6rem,4vw,2rem)' }}>অ্যাডমিন প্যানেল</h2>

      {/* Tabs - এখন মোবাইলে অনুভূমিক স্ক্রল করবে */}
      <div className="admin-tabs" style={{ flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
        {ADMIN_TABS.map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            style={{ flexShrink: 0 }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#888', margin: '1rem 0' }}>লোড হচ্ছে...</p>}

      {tab === 'analytics' && analytics ? (
        <div>
          <div className="dashboard-grid">
            <div className="stat-card"><h3>মোট ইউজার</h3><div className="value">{analytics.totalUsers}</div></div>
            <div className="stat-card"><h3>মোট ব্লগ</h3><div className="value">{analytics.totalBlogs}</div></div>
            <div className="stat-card"><h3>মোট পণ্য</h3><div className="value">{analytics.totalProducts}</div></div>
            <div className="stat-card"><h3>মোট প্রশ্ন</h3><div className="value">{analytics.totalQuestions}</div></div>
            <div className="stat-card"><h3>মোট দর</h3><div className="value">{analytics.totalPrices}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="chart-container" style={{ padding: '1rem', height: '300px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1rem' }}>ইউজার রোল বিতরণ</h3>
              <canvas ref={pieChartRef}></canvas>
            </div>
            <div className="chart-container" style={{ padding: '1rem', height: '300px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1rem' }}>বিভাগ অনুযায়ী গড় দাম</h3>
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </div>
      ) : tab === 'analytics' ? (
        <p style={{ textAlign: 'center', color: '#888' }}>লোড হচ্ছে...</p>
      ) : (
        <div>
          {['blog','products','prices'].includes(tab) && items.map(item => (
            <div key={item.id} className="pending-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                {tab === 'blog' && <><strong>{item.title}</strong> <small>({item.category})</small><br /><small>by {item.user_name}</small></>}
                {tab === 'products' && <><strong>{item.name}</strong><br /><small>by {item.user_name}</small></>}
                {tab === 'prices' && <>{item.division} → {item.district} → {item.upazila} → {item.area}<br /><strong>{item.crop}</strong>: {item.price} টাকা <small>by {item.user_name}</small></>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-primary btn-sm" onClick={() => approveItem(tab === 'blog' ? 'blogs' : tab === 'products' ? 'products' : 'agent_prices', item.id)}>অনুমোদন</button>
                <button className="btn btn-outline btn-sm" onClick={() => cancelItem(tab === 'blog' ? 'blogs' : tab === 'products' ? 'products' : 'agent_prices', item.id)}>বাতিল</button>
              </div>
            </div>
          ))}
          {tab === 'answers' && items.map(item => (
            <div key={item.id} className="pending-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>উত্তর:</strong> {item.answer?.substring(0,100)}...
                <br /><small>দ্বারা {item.user_name}</small>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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
          {['blog','products','prices','answers'].includes(tab) && !loading && items.length === 0 && <p>কোনো পেন্ডিং নেই</p>}
        </div>
      )}
    </div>
  );
}
