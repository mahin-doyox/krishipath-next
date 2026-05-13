'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import bangladeshData from '@/lib/bangladeshData';
import { Chart } from 'chart.js/auto';

const divisions = Object.keys(bangladeshData);

export default function PricesClient() {
  const { user, profile, supabase } = useAuth();
  const [div, setDiv] = useState('');
  const [dist, setDist] = useState('');
  const [upaz, setUpaz] = useState('');
  const [area, setArea] = useState('');
  const [crop, setCrop] = useState('');
  const [areas, setAreas] = useState([]);
  const [crops, setCrops] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [stats, setStats] = useState({ current: '--', max: '--', min: '--', avg: '--', trend: '' });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Dropdown options
  const districts = div ? Object.keys(bangladeshData[div] || {}) : [];
  const upazilas = div && dist ? bangladeshData[div][dist] || [] : [];

  // Fetch areas when upazila selected
  useEffect(() => {
    if (div && dist && upaz) {
      supabase.from('agent_prices').select('area', { distinct: true })
        .eq('division', div).eq('district', dist).eq('upazila', upaz).eq('approved', true)
        .then(({ data }) => {
          if (data) setAreas([...new Set(data.map(a => a.area).filter(Boolean))]);
        });
    } else {
      setAreas([]);
      setArea('');
    }
  }, [div, dist, upaz]);

  // Fetch crops when area selected
  useEffect(() => {
    if (div && dist && upaz && area) {
      supabase.from('agent_prices').select('crop', { distinct: true })
        .eq('division', div).eq('district', dist).eq('upazila', upaz).eq('area', area).eq('approved', true)
        .then(({ data }) => {
          if (data) setCrops([...new Set(data.map(c => c.crop).filter(Boolean))]);
        });
    } else {
      setCrops([]);
      setCrop('');
    }
  }, [div, dist, upaz, area]);

  // Load price dashboard when crop selected
  useEffect(() => {
    if (!crop) { setShowDashboard(false); return; }
    supabase.from('agent_prices').select('*')
      .eq('division', div).eq('district', dist).eq('upazila', upaz).eq('area', area).eq('crop', crop)
      .eq('approved', true).order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setStats({ current: 'N/A', max: 'N/A', min: 'N/A', avg: 'N/A', trend: '' });
          if (chartInstance.current) chartInstance.current.destroy();
          setShowDashboard(true);
          return;
        }
        const prices = data.map(d => d.price);
        const labels = data.map(d => new Date(d.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }));
        const current = prices[prices.length - 1];
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
        let trend = '';
        if (prices.length >= 2) {
          const diff = prices[prices.length - 1] - prices[prices.length - 2];
          trend = diff > 0 ? '📈 বাড়ছে' : diff < 0 ? '📉 কমছে' : '⏺️ স্থিতিশীল';
        }
        setStats({ current: current + ' টাকা/কেজি', max: max + ' টাকা', min: min + ' টাকা', avg: avg + ' টাকা', trend });
        setShowDashboard(true);

        if (chartRef.current) {
          if (chartInstance.current) chartInstance.current.destroy();
          const ctx = chartRef.current.getContext('2d');
          chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: crop + ' (' + area + ', ' + upaz + ')', data: prices, borderColor: '#0d2e1d', backgroundColor: 'rgba(13,46,29,0.1)', fill: true, tension: 0.3, pointRadius: 4, borderWidth: 3 }] },
            options: { responsive: true, plugins: { legend: { labels: { font: { size: 14 } } } }, scales: { y: { beginAtZero: false, title: { display: true, text: 'মূল্য (টাকা)' } }, x: { title: { display: true, text: 'তারিখ' } } } }
          });
        }
      });
  }, [crop]);

  // Agent price upload form state
  const [agentDiv, setAgentDiv] = useState('');
  const [agentDist, setAgentDist] = useState('');
  const [agentUpaz, setAgentUpaz] = useState('');
  const [agentArea, setAgentArea] = useState('');
  const [agentCrop, setAgentCrop] = useState('');
  const [agentPrice, setAgentPrice] = useState('');
  const [agentAreaSuggestions, setAgentAreaSuggestions] = useState([]);
  const [agentCropSuggestions, setAgentCropSuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('agent_prices').select('crop', { distinct: true }).eq('approved', true)
      .then(({ data }) => {
        if (data) setAgentCropSuggestions([...new Set(data.map(c => c.crop).filter(Boolean))]);
      });
  }, []);

  useEffect(() => {
    if (agentDiv && agentDist && agentUpaz) {
      supabase.from('agent_prices').select('area', { distinct: true })
        .eq('division', agentDiv).eq('district', agentDist).eq('upazila', agentUpaz).eq('approved', true)
        .then(({ data }) => {
          if (data) setAgentAreaSuggestions([...new Set(data.map(a => a.area).filter(Boolean))]);
        });
    } else {
      setAgentAreaSuggestions([]);
    }
  }, [agentDiv, agentDist, agentUpaz]);

  const handleUploadPrice = async () => {
    if (!user || !profile || (profile.role !== 'agent' && profile.role !== 'admin')) return alert('শুধুমাত্র এজেন্ট ও অ্যাডমিন বাজার দর যোগ করতে পারেন।');
    if (!agentDiv || !agentDist || !agentUpaz || !agentArea || !agentCrop || !agentPrice) return alert('সব তথ্য পূরণ করুন');
    setUploading(true);
    await supabase.from('agent_prices').insert([{
      division: agentDiv, district: agentDist, upazila: agentUpaz, area: agentArea, crop: agentCrop,
      price: parseFloat(agentPrice), user_id: user.id, user_name: profile.name, approved: false
    }]);
    alert('জমা হয়েছে, অনুমোদনের অপেক্ষায়।');
    setAgentDiv(''); setAgentDist(''); setAgentUpaz(''); setAgentArea(''); setAgentCrop(''); setAgentPrice('');
    setUploading(false);
  };

  return (
    <>
      {user && (profile?.role === 'agent' || profile?.role === 'admin') && (
        <div className="form-card">
          <h3>বাজার দর যোগ করুন</h3>
          <select value={agentDiv} onChange={e => { setAgentDiv(e.target.value); setAgentDist(''); setAgentUpaz(''); }} className="form-control">
            <option value="">বিভাগ</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={agentDist} onChange={e => { setAgentDist(e.target.value); setAgentUpaz(''); }} className="form-control mt-3">
            <option value="">জেলা</option>
            {agentDiv && Object.keys(bangladeshData[agentDiv] || {}).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={agentUpaz} onChange={e => setAgentUpaz(e.target.value)} className="form-control mt-3">
            <option value="">উপজেলা</option>
            {agentDiv && agentDist && bangladeshData[agentDiv]?.[agentDist]?.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input list="areaList" value={agentArea} onChange={e => setAgentArea(e.target.value)} placeholder="এলাকার নাম" className="form-control mt-3" />
          <datalist id="areaList">{agentAreaSuggestions.map(a => <option key={a} value={a} />)}</datalist>
          <input list="cropList" value={agentCrop} onChange={e => setAgentCrop(e.target.value)} placeholder="ফসলের নাম" className="form-control mt-3" />
          <datalist id="cropList">{agentCropSuggestions.map(c => <option key={c} value={c} />)}</datalist>
          <input type="number" value={agentPrice} onChange={e => setAgentPrice(e.target.value)} placeholder="দাম (টাকা/কেজি)" className="form-control mt-3" />
          <button className="btn btn-primary w-100 mt-3" onClick={handleUploadPrice} disabled={uploading}>
            {uploading ? 'জমা হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      )}

      <div className="flex-row">
        <select value={div} onChange={e => { setDiv(e.target.value); setDist(''); setUpaz(''); setArea(''); setCrop(''); }} className="form-control" style={{ maxWidth: '200px' }}>
          <option value="">বিভাগ</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={dist} onChange={e => { setDist(e.target.value); setUpaz(''); setArea(''); setCrop(''); }} className="form-control" style={{ maxWidth: '200px' }}>
          <option value="">জেলা</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={upaz} onChange={e => { setUpaz(e.target.value); setArea(''); setCrop(''); }} className="form-control" style={{ maxWidth: '200px' }}>
          <option value="">উপজেলা</option>
          {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={area} onChange={e => { setArea(e.target.value); setCrop(''); }} className="form-control" style={{ maxWidth: '200px' }}>
          <option value="">এলাকা</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {area && (
          <select value={crop} onChange={e => setCrop(e.target.value)} className="form-control" style={{ maxWidth: '200px' }}>
            <option value="">ফসল</option>
            {crops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {showDashboard && (
        <div id="priceDashboard">
          <div className="dashboard-grid">
            <div className="stat-card"><h3>বর্তমান মূল্য</h3><div className="value">{stats.current}</div><div className="trend">{stats.trend}</div></div>
            <div className="stat-card"><h3>সর্বোচ্চ (সাম্প্রতিক)</h3><div className="value">{stats.max}</div></div>
            <div className="stat-card"><h3>সর্বনিম্ন (সাম্প্রতিক)</h3><div className="value">{stats.min}</div></div>
            <div className="stat-card"><h3>গড় মূল্য</h3><div className="value">{stats.avg}</div></div>
          </div>
          <div className="chart-container"><canvas ref={chartRef}></canvas></div>
        </div>
      )}
    </>
  );
}