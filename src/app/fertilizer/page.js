'use client';
import { useState, useMemo } from 'react';

// kg per hectare: [urea, tsp, mop, gypsum]. General guide values; confirm with the local DAE office.
const CROPS = {
  'বোরো ধান': [260, 100, 70, 60],
  'আমন ধান': [150, 60, 50, 50],
  'আউশ ধান': [120, 50, 40, 0],
  'গম': [220, 180, 50, 120],
  'আলু': [270, 180, 250, 120],
  'ভুট্টা': [500, 200, 120, 60],
  'সরিষা': [200, 170, 85, 150],
  'টমেটো': [250, 150, 150, 0],
};
const UNITS = { 'শতাংশ': 1, 'বিঘা': 33, 'একর': 100, 'হেক্টর': 247.1 };
const NAMES = ['ইউরিয়া', 'টিএসপি', 'এমওপি', 'জিপসাম'];
const bn = (n) => Number(n).toLocaleString('bn-BD', { maximumFractionDigits: 1 });

export default function FertilizerPage() {
  const [crop, setCrop] = useState('বোরো ধান');
  const [area, setArea] = useState(33);
  const [unit, setUnit] = useState('শতাংশ');
  const [price, setPrice] = useState([27, 27, 20, 10]);

  const rows = useMemo(() => {
    const decimals = (Number(area) || 0) * UNITS[unit];
    return CROPS[crop].map((perHa, i) => {
      const kg = (perHa * decimals) / 247.1;
      return { name: NAMES[i], kg, cost: kg * price[i] };
    }).filter((r) => r.kg > 0);
  }, [crop, area, unit, price]);
  const total = rows.reduce((a, r) => a + r.cost, 0);

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title">সার হিসাব</h2>
      <div className="form-card">
        <div className="form-group">
          <label>ফসল</label>
          <select className="form-control" value={crop} onChange={(e) => setCrop(e.target.value)}>
            {Object.keys(CROPS).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-row" style={{ gap: 10 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>জমির পরিমাণ</label>
            <input className="form-control" type="number" min="0" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>একক</label>
            <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {Object.keys(UNITS).map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <details>
          <summary>সারের দাম (টাকা/কেজি) বদলান</summary>
          <div className="flex-row" style={{ gap: 8, marginTop: 8 }}>
            {NAMES.map((n, i) => (
              <div key={n} style={{ flex: 1 }}>
                <label style={{ fontSize: '.8rem' }}>{n}</label>
                <input className="form-control" type="number" value={price[i]}
                  onChange={(e) => setPrice(price.map((p, j) => (j === i ? Number(e.target.value) : p)))} />
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="card-grid" style={{ marginTop: 16 }}>
        {rows.map((r) => (
          <div key={r.name} className="stat-card">
            <h3>{r.name}</h3>
            <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{bn(r.kg)} কেজি</p>
            <small>প্রায় ৳{bn(Math.round(r.cost))}</small>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 14, fontWeight: 600 }}>মোট সার খরচ: ৳{bn(Math.round(total))}</p>
      <p style={{ fontSize: '.85rem', opacity: .75 }}>
        এটি সাধারণ নির্দেশিকা। মাটি পরীক্ষা বা স্থানীয় উপজেলা কৃষি অফিসের পরামর্শ অনুযায়ী যাচাই করুন।
      </p>
    </div>
  );
}
