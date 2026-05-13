import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <img className="hero-image" src="https://i.ibb.co.com/tPMYJzkC/Add-Text-05-09-11-01-49.png" alt="কৃষিপথ ব্যানার" />
        <div className="hero-container">
          <div className="hero-text">
            <h1>কৃষির ডিজিটাল <span style={{ color: 'var(--gold)', borderBottom: '4px dotted var(--gold-light)' }}>পথচলা</span><br />এখন শুরু</h1>
            <p>কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের এক অনন্য প্ল্যাটফর্ম।</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth?mode=register" className="btn btn-primary"><i className="fas fa-seedling"></i> যুক্ত হোন</Link>
              <Link href="/bazar" className="btn btn-outline"><i className="fas fa-store"></i> বাজার দেখুন</Link>
            </div>
          </div>
        </div>
      </section>
      <div className="container">
        <div className="quick-nav-grid">
          <Link href="/bazar" className="quick-nav-card"><i className="fas fa-store"></i><h3>কৃষিবাজার</h3></Link>
          <Link href="/prices" className="quick-nav-card"><i className="fas fa-chart-line"></i><h3>বাজার দর</h3></Link>
          <Link href="/blog" className="quick-nav-card"><i className="fas fa-newspaper"></i><h3>ব্লগ</h3></Link>
          <Link href="/forum" className="quick-nav-card"><i className="fas fa-comments"></i><h3>প্রশ্নোত্তর</h3></Link>
        </div>
        <div className="card-grid">
          <div className="feature-card"><i className="fas fa-tractor" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i><h3>কৃষি বাজার</h3><p>সরাসরি কৃষকের পণ্য</p></div>
          <div className="feature-card"><i className="fas fa-money-bill-wave" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i><h3>সঠিক মূল্য</h3><p>এলাকাভিত্তিক লাইভ দর</p></div>
          <div className="feature-card"><i className="fas fa-users" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i><h3>কমিউনিটি</h3><p>কৃষক-বিশেষজ্ঞ সংযোগ</p></div>
          <div className="feature-card"><i className="fas fa-bell" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i><h3>নোটিফিকেশন</h3><p>ইমেইল ও অ্যাপ আপডেট</p></div>
        </div>
      </div>
    </main>
  );
}