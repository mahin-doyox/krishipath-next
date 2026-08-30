export default function Footer() {
  const quickLinks = [
    { href: '/', label: 'হোম' },
    { href: '/blog', label: 'ব্লগ' },
    { href: '/forum', label: 'প্রশ্নোত্তর' },
    { href: '/bazar', label: 'কৃষিবাজার' },
    { href: '/prices', label: 'বাজার দর' },
    { href: '/crop-disease', label: 'রোগ নির্ণয়' },
    { href: '/crop-chat', label: 'কৃষি চ্যাট' },
    { href: '/my-crops', label: 'আমার ফসল' },
    { href: '/profile', label: 'প্রোফাইল' },
  ];

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>কৃষিপথ</h4>
            <p>
              কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম।
            </p>
            <div className="social-links">
              <a href="https://youtube.com/@krishipathbd" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
              <a href="https://facebook.com/krishipath" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
              <a href="https://linkedin.com/company/krishipath" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
              <a href="https://instagram.com/krishipath" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>দ্রুত লিংক</h4>
            {quickLinks.map(link => (
              <p key={link.href}>
                <a href={link.href}>{link.label}</a>
              </p>
            ))}
          </div>

          <div className="footer-col">
            <h4>যোগাযোগ</h4>
            <p><i className="fas fa-phone"></i> <a href="tel:+8801796015069">+8801796015069</a></p>
            <p><i className="fas fa-envelope"></i> <a href="mailto:krishipathbd@gmail.com">krishipathbd@gmail.com</a></p>
            <p><i className="fas fa-map-marker-alt"></i> বালিয়াডাঙ্গী সদর, ঠাকুরগাঁও, রংপুর, বাংলাদেশ</p>
          </div>
        </div>

        {/* পলিসি */}
        <div className="policy-section">
          <details>
            <summary>শর্তাবলী এবং নীতি</summary>
            <div className="policy-content">
              <p>পরিষেবা গ্রহণের শর্তাবলী আপনি আমাদের পরিষেবা ব্যবহার করার মাধ্যমে এই শর্তাবলী সম্মত হন।</p>
              <p>ব্যবহারকারীর দায়িত্ব আপনি এই পরিষেবাগুলি শুধুমাত্র আইনি উদ্দেশ্যে ব্যবহার করতে রাজি আছেন।</p>
              <p>অধিকার এবং মালিকানা আমাদের পরিষেবাগুলির সব সত্ত্বাধিকার আমাদের মালিকানাধীন।</p>
              <p>বিক্রয় বা স্থানান্তর আমরা আমাদের পরিষেবা বা কোনো অংশের বিক্রয় বা স্থানান্তর করার অধিকার রাখি।</p>
              <p>নির্দিষ্ট বাধ্যবাধকতা কিছু ক্ষেত্রে, আমরা আপনার পরিষেবার অ্যাক্সেস সীমিত বা বাতিল করতে পারি।</p>
            </div>
          </details>
        </div>

        <div className="policy-section">
          <details>
            <summary>গোপনীয়তা নীতি</summary>
            <div className="policy-content">
              <p>আমরা কীভাবে আপনার তথ্য সংগ্রহ করি আমরা আপনার ব্যক্তিগত তথ্য বিভিন্ন উপায়ে সংগ্রহ করতে পারি।</p>
              <p>তথ্য ব্যবহারের উদ্দেশ্য আমরা আপনার তথ্য ব্যবহার করতে পারি প্রশ্নের উত্তর দেওয়ার জন্য, পরিষেবা উন্নত করার জন্য।</p>
              <p>তথ্য শেয়ারিং আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের সাথে শেয়ার করি না।</p>
              <p>তথ্য সুরক্ষা আমরা আপনার তথ্য সুরক্ষিত রাখার জন্য যথাযথ নিরাপত্তা ব্যবস্থা গ্রহণ করি।</p>
              <p>আপনার অধিকার আপনি আপনার তথ্য অ্যাক্সেস, সংশোধন বা মুছে ফেলার অধিকার রাখেন।</p>
            </div>
          </details>
        </div>

        <div className="footer-bottom">
          <p>
            © ২০২৬ কৃষিপথ • সর্বস্বত্ব সংরক্ষিত &nbsp;|&nbsp; Powered by{' '}
            <a href="https://www.doyox.com" target="_blank" rel="noopener noreferrer" style={{ color: '#d4a373', textDecoration: 'none' }}>
              doyox
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
