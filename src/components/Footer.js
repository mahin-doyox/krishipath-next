export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>কৃষিপথ</h4>
            <p>কৃষি পণ্য বিক্রয়, বাজার মূল্য, পরামর্শ ও অভিজ্ঞতা শেয়ারের ডিজিটাল প্ল্যাটফর্ম।</p>
            <div className="social-links">
              <a href="https://youtube.com/@krishipathbd" target="_blank"><i className="fab fa-youtube"></i></a>
              <a href="https://facebook.com/krishipath" target="_blank"><i className="fab fa-facebook"></i></a>
              <a href="https://linkedin.com/company/krishipath" target="_blank"><i className="fab fa-linkedin"></i></a>
              <a href="https://instagram.com/krishipath" target="_blank"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>যোগাযোগ</h4>
            <p><i className="fas fa-phone"></i> +8801796015069</p>
            <p><i className="fas fa-envelope"></i> krishipathbd@gmail.com</p>
            <p><i className="fas fa-map-marker-alt"></i> বালিয়াডাঙ্গী সদর, ঠাকুরগাঁও, রংপুর, বাংলাদেশ</p>
          </div>
        </div>
        <div className="policy-section">
          <details>
            <summary>শর্তাবলী এবং নীতি</summary>
            <p>পরিষেবা গ্রহণের শর্তাবলী... (বাকি অংশ পূর্বের মতো)</p>
          </details>
        </div>
        <div className="policy-section">
          <details>
            <summary>গোপনীয়তা নীতি</summary>
            <p>আমরা কীভাবে আপনার তথ্য সংগ্রহ করি... (বাকি অংশ পূর্বের মতো)</p>
          </details>
        </div>
        <div className="footer-bottom">
          <p>© ২০২৬ কৃষিপথ • সর্বস্বত্ব সংরক্ষিত &nbsp;|&nbsp; Powered by <a href="https://www.doyox.com" target="_blank" style={{color:'#d4a373', textDecoration:'none'}}>doyox</a></p>
        </div>
      </div>
    </footer>
  );
}