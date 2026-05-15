'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import bangladeshData from '@/lib/bangladeshData';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const divisions = Object.keys(bangladeshData);

export default function PricesClient() {
  const { user, profile, supabase } = useAuth();

  // ---------------- Dashboard Filters ----------------
  const [div, setDiv] = useState('');
  const [dist, setDist] = useState('');
  const [upaz, setUpaz] = useState('');
  const [area, setArea] = useState('');
  const [crop, setCrop] = useState('');
  const [areas, setAreas] = useState([]);
  const [crops, setCrops] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [stats, setStats] = useState({ current: '--', max: '--', min: '--', avg: '--', trend: '' });

  // ---------------- Timeframe State ----------------
  const [timeframe, setTimeframe] = useState('daily'); // daily | weekly | monthly

  // ---------------- Chart Refs ----------------
  const trendChartRef = useRef(null);
  const comparisonChartRef = useRef(null);
  const regionalChartRef = useRef(null);
  const trendInstance = useRef(null);
  const comparisonInstance = useRef(null);
  const regionalInstance = useRef(null);

  // ---------------- Crop Comparison State ----------------
  const [compareCrop, setCompareCrop] = useState('');
  const [compareCrops, setCompareCrops] = useState([]);

  // ---------------- Regional Comparison State ----------------
  const [regionalCrop, setRegionalCrop] = useState('');
  const [regionalData, setRegionalData] = useState(null);

  // ---------------- Watchlist State ----------------
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlist, setShowWatchlist] = useState(false);

  // ---------------- Agent Upload Form State ----------------
  const [agentDiv, setAgentDiv] = useState('');
  const [agentDist, setAgentDist] = useState('');
  const [agentUpaz, setAgentUpaz] = useState('');
  const [agentArea, setAgentArea] = useState('');
  const [agentCrop, setAgentCrop] = useState('');
  const [agentPrice, setAgentPrice] = useState('');
  const [agentAreaSuggestions, setAgentAreaSuggestions] = useState([]);
  const [agentCropSuggestions, setAgentCropSuggestions] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Derived dropdown options
  const districts = div ? Object.keys(bangladeshData[div] || {}) : [];
  const upazilas = div && dist ? bangladeshData[div][dist] || [] : [];

  // ============================================
  //  LOAD WATCHLIST FROM LOCALSTORAGE
  // ============================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('krishipath_watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {}
  }, []);

  const saveWatchlist = (list) => {
    setWatchlist(list);
    localStorage.setItem('krishipath_watchlist', JSON.stringify(list));
  };

  const toggleWatchlist = (item) => {
    const key = `${item.division}|${item.district}|${item.upazila}|${item.area}|${item.crop}`;
    if (watchlist.find(w => `${w.division}|${w.district}|${w.upazila}|${w.area}|${w.crop}` === key)) {
      saveWatchlist(watchlist.filter(w => `${w.division}|${w.district}|${w.upazila}|${w.area}|${w.crop}` !== key));
    } else {
      saveWatchlist([...watchlist, item]);
    }
  };

  const isInWatchlist = (item) => {
    const key = `${item.division}|${item.district}|${item.upazila}|${item.area}|${item.crop}`;
    return watchlist.some(w => `${w.division}|${w.district}|${w.upazila}|${w.area}|${w.crop}` === key);
  };

  // ============================================
  //  FETCH AREAS / CROPS
  // ============================================
  useEffect(() => {
    if (div && dist && upaz) {
      supabase.from('agent_prices').select('area', { distinct: true })
        .eq('division', div).eq('district', dist).eq('upazila', upaz).eq('approved', true)
        .then(({ data }) => { if (data) setAreas([...new Set(data.map(a => a.area).filter(Boolean))]); });
    } else { setAreas([]); setArea(''); }
  }, [div, dist, upaz, supabase]);

  useEffect(() => {
    if (div && dist && upaz && area) {
      supabase.from('agent_prices').select('crop', { distinct: true })
        .eq('division', div).eq('district', dist).eq('upazila', upaz).eq('area', area).eq('approved', true)
        .then(({ data }) => { if (data) setCrops([...new Set(data.map(c => c.crop).filter(Boolean))]); });
    } else { setCrops([]); setCrop(''); }
  }, [div, dist, upaz, area, supabase]);

  // Fetch all available crops for comparison
  useEffect(() => {
    supabase.from('agent_prices').select('crop', { distinct: true }).eq('approved', true)
      .then(({ data }) => { if (data) setCompareCrops([...new Set(data.map(c => c.crop).filter(Boolean))]); });
  }, [supabase]);

  // ============================================
  //  TREND CHART (Timeframe + Moving Average)
  // ============================================
  const buildTrendChart = async () => {
    if (!crop || !area) return;
    let days = 30;
    if (timeframe === 'weekly') days = 90;
    if (timeframe === 'monthly') days = 365;

    const { data } = await supabase
      .from('agent_prices')
      .select('*')
      .eq('division', div).eq('district', dist).eq('upazila', upaz)
      .eq('area', area).eq('crop', crop).eq('approved', true)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      if (trendInstance.current) trendInstance.current.destroy();
      return;
    }

    const prices = data.map(d => d.price);
    const labels = data.map(d => new Date(d.created_at).toLocaleDateString('bn-BD'));

    // 7-day moving average
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
      const slice = prices.slice(Math.max(0, i - 6), i + 1);
      ma.push((slice.reduce((a, b) => a + b, 0) / slice.length));
    }

    if (trendChartRef.current) {
      if (trendInstance.current) trendInstance.current.destroy();
      const ctx = trendChartRef.current.getContext('2d');
      trendInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: `${crop} (${area}) - মূল্য`,
              data: prices,
              borderColor: '#0d2e1d',
              backgroundColor: 'rgba(13,46,29,0.1)',
              fill: true, tension: 0.3, pointRadius: 2, borderWidth: 2
            },
            {
              label: '7-দিনের গড়',
              data: ma,
              borderColor: '#d4a373',
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { font: { size: 12 } } } },
          scales: { y: { beginAtZero: false } }
        }
      });
    }
  };

  useEffect(() => {
    if (showDashboard && crop) buildTrendChart();
  }, [crop, showDashboard, timeframe]);

  // ============================================
  //  CROP COMPARISON CHART
  // ============================================
  const buildComparisonChart = async () => {
    if (!compareCrop || !area) return;
    const primaryCrop = crop || compareCrop; // use dashboard crop if available, else compare crop

    const { data } = await supabase
      .from('agent_prices')
      .select('*')
      .eq('division', div).eq('district', dist).eq('upazila', upaz)
      .eq('area', area).eq('approved', true)
      .in('crop', [primaryCrop, compareCrop])
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      if (comparisonInstance.current) comparisonInstance.current.destroy();
      return;
    }

    // Group by crop + date
    const map = {};
    data.forEach(d => {
      const date = new Date(d.created_at).toLocaleDateString('bn-BD');
      if (!map[date]) map[date] = {};
      map[date][d.crop] = (map[date][d.crop] || 0) + d.price;
      map[date][`${d.crop}_count`] = (map[date][`${d.crop}_count`] || 0) + 1;
    });

    const labels = Object.keys(map).sort();
    const dataset1 = labels.map(date => {
      const total = map[date][primaryCrop] || 0;
      const count = map[date][`${primaryCrop}_count`] || 1;
      return total / count;
    });
    const dataset2 = labels.map(date => {
      const total = map[date][compareCrop] || 0;
      const count = map[date][`${compareCrop}_count`] || 1;
      return total / count;
    });

    if (comparisonChartRef.current) {
      if (comparisonInstance.current) comparisonInstance.current.destroy();
      const ctx = comparisonChartRef.current.getContext('2d');
      comparisonInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: primaryCrop, data: dataset1, borderColor: '#0d2e1d', borderWidth: 2, tension: 0.2 },
            { label: compareCrop, data: dataset2, borderColor: '#d4a373', borderWidth: 2, tension: 0.2 }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { font: { size: 12 } } } },
          scales: { y: { beginAtZero: false } }
        }
      });
    }
  };

  useEffect(() => {
    if (compareCrop) buildComparisonChart();
  }, [compareCrop, area]);

  // ============================================
  //  REGIONAL COMPARISON CHART
  // ============================================
  const buildRegionalChart = async () => {
    if (!regionalCrop) return;
    const { data } = await supabase
      .from('agent_prices')
      .select('division, price')
      .eq('crop', regionalCrop)
      .eq('approved', true);

    if (!data || data.length === 0) {
      if (regionalInstance.current) regionalInstance.current.destroy();
      setRegionalData(null);
      return;
    }

    const divisionTotals = {};
    const divisionCounts = {};
    data.forEach(d => {
      divisionTotals[d.division] = (divisionTotals[d.division] || 0) + d.price;
      divisionCounts[d.division] = (divisionCounts[d.division] || 0) + 1;
    });

    const labels = Object.keys(divisionTotals);
    const values = labels.map(div => Math.round(divisionTotals[div] / divisionCounts[div]));
    setRegionalData({ labels, values });

    if (regionalChartRef.current) {
      if (regionalInstance.current) regionalInstance.current.destroy();
      const ctx = regionalChartRef.current.getContext('2d');
      regionalInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: `${regionalCrop} - গড় দাম (টাকা)`, data: values, backgroundColor: '#0d2e1d' }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  };

  useEffect(() => {
    if (regionalCrop) buildRegionalChart();
  }, [regionalCrop]);

  // ============================================
  //  AGENT UPLOAD LOGIC
  // ============================================
  useEffect(() => {
    supabase.from('agent_prices').select('crop', { distinct: true }).eq('approved', true)
      .then(({ data }) => { if (data) setAgentCropSuggestions([...new Set(data.map(c => c.crop).filter(Boolean))]); });
  }, [supabase]);

  useEffect(() => {
    if (agentDiv && agentDist && agentUpaz) {
      supabase.from('agent_prices').select('area', { distinct: true })
        .eq('division', agentDiv).eq('district', agentDist).eq('upazila', agentUpaz).eq('approved', true)
        .then(({ data }) => { if (data) setAgentAreaSuggestions([...new Set(data.map(a => a.area).filter(Boolean))]); });
    } else { setAgentAreaSuggestions([]); }
  }, [agentDiv, agentDist, agentUpaz, supabase]);

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

  // ============================================
  //  RENDER
  // ============================================
  return (
    <>
      {/* ---------- WATCHLIST ---------- */}
      {watchlist.length > 0 && (
        <div className="form-card" style={{ marginBottom: '1rem' }}>
          <h3>⭐ আপনার পছন্দের আইটেম</h3>
          {watchlist.map((w, i) => (
            <div key={i} className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{w.crop} ({w.area}, {w.district})</span>
              <button className="btn btn-outline btn-sm" onClick={() => toggleWatchlist(w)}>❌</button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- AGENT UPLOAD FORM ---------- */}
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

      {/* ---------- FILTER ROW ---------- */}
      <div className="flex-row">
        <select value={div} onChange={e => { setDiv(e.target.value); setDist(''); setUpaz(''); setArea(''); setCrop(''); setShowDashboard(false); }} className="form-control" style={{ maxWidth: '180px' }}>
          <option value="">বিভাগ</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={dist} onChange={e => { setDist(e.target.value); setUpaz(''); setArea(''); setCrop(''); setShowDashboard(false); }} className="form-control" style={{ maxWidth: '180px' }}>
          <option value="">জেলা</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={upaz} onChange={e => { setUpaz(e.target.value); setArea(''); setCrop(''); setShowDashboard(false); }} className="form-control" style={{ maxWidth: '180px' }}>
          <option value="">উপজেলা</option>
          {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={area} onChange={e => { setArea(e.target.value); setCrop(''); setShowDashboard(false); }} className="form-control" style={{ maxWidth: '180px' }}>
          <option value="">এলাকা</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {area && (
          <select value={crop} onChange={e => { setCrop(e.target.value); setShowDashboard(true); }} className="form-control" style={{ maxWidth: '180px' }}>
            <option value="">ফসল</option>
            {crops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* ---------- TIMEFRAME SELECTOR ---------- */}
      {showDashboard && (
        <div className="filter-tabs">
          {['daily', 'weekly', 'monthly'].map(tf => (
            <button key={tf} className={`filter-tab ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>
              {tf === 'daily' ? 'দৈনিক' : tf === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক'}
            </button>
          ))}
        </div>
      )}

      {/* ---------- DASHBOARD CARDS ---------- */}
      {showDashboard && (
        <>
          <div className="dashboard-grid">
            <div className="stat-card"><h3>বর্তমান মূল্য</h3><div className="value">{stats.current}</div><div className="trend">{stats.trend}</div></div>
            <div className="stat-card"><h3>সর্বোচ্চ</h3><div className="value">{stats.max}</div></div>
            <div className="stat-card"><h3>সর্বনিম্ন</h3><div className="value">{stats.min}</div></div>
            <div className="stat-card"><h3>গড় মূল্য</h3><div className="value">{stats.avg}</div></div>
          </div>

          <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3>📈 মূল্য প্রবণতা</h3>
              {crop && (
                <button className="btn btn-outline btn-sm" onClick={() => toggleWatchlist({ division: div, district: dist, upazila, area, crop })}>
                  {isInWatchlist({ division: div, district: dist, upazila, area, crop }) ? '⭐ পছন্দ থেকে সরান' : '☆ পছন্দসই যোগ করুন'}
                </button>
              )}
            </div>
            <canvas ref={trendChartRef}></canvas>
          </div>

          {/* ---------- CROP COMPARISON ---------- */}
          <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
            <h3>🔄 ফসলের তুলনা</h3>
            <div className="flex-row" style={{ marginTop: '0.5rem' }}>
              <select value={compareCrop} onChange={e => setCompareCrop(e.target.value)} className="form-control" style={{ maxWidth: '200px' }}>
                <option value="">ফসল বাছুন</option>
                {compareCrops.filter(c => c !== crop).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {compareCrop && <canvas ref={comparisonChartRef} style={{ marginTop: '1rem' }}></canvas>}
          </div>

          {/* ---------- REGIONAL COMPARISON ---------- */}
          <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
            <h3>🗺️ আঞ্চলিক তুলনা</h3>
            <div className="flex-row" style={{ marginTop: '0.5rem' }}>
              <select value={regionalCrop} onChange={e => setRegionalCrop(e.target.value)} className="form-control" style={{ maxWidth: '200px' }}>
                <option value="">ফসল বাছুন</option>
                {compareCrops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {regionalCrop && regionalData && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                  {regionalData.values.indexOf(Math.max(...regionalData.values)) >= 0 &&
                    `📌 সর্বোচ্চ: ${regionalData.labels[regionalData.values.indexOf(Math.max(...regionalData.values))]} (${Math.max(...regionalData.values)} টাকা) | `}
                  {regionalData.values.indexOf(Math.min(...regionalData.values)) >= 0 &&
                    `সর্বনিম্ন: ${regionalData.labels[regionalData.values.indexOf(Math.min(...regionalData.values))]} (${Math.min(...regionalData.values)} টাকা)`}
                </p>
                <canvas ref={regionalChartRef}></canvas>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------- SUMMARY (Mobile friendly) ---------- */}
      {showDashboard && stats.current !== '--' && (
        <div className="feature-card" style={{ textAlign: 'left', marginTop: '1rem' }}>
          <h4>📋 আজকের সারসংক্ষেপ</h4>
          <p><strong>{crop}</strong> ({area}, {upazila}, {dist}): <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stats.current}</span></p>
          {stats.trend && <p>📊 প্রবণতা: {stats.trend}</p>}
        </div>
      )}
    </>
  );
}
