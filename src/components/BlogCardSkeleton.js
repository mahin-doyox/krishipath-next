export default function BlogCardSkeleton() {
  return (
    <div className="feature-card skeleton-card">
      {/* ক্যাটাগরি */}
      <div className="skeleton" style={{ width: '30%', height: '0.8rem', marginBottom: '0.8rem', borderRadius: '20px' }}></div>
      {/* শিরোনাম */}
      <div className="skeleton" style={{ width: '85%', height: '1.4rem', marginBottom: '0.6rem' }}></div>
      <div className="skeleton" style={{ width: '70%', height: '1.4rem', marginBottom: '1rem' }}></div>
      {/* মেটা তথ্য */}
      <div className="skeleton" style={{ width: '50%', height: '0.9rem', marginBottom: '1.2rem' }}></div>
      {/* কন্টেন্ট লাইন */}
      <div className="skeleton" style={{ width: '100%', height: '0.9rem', marginBottom: '0.5rem' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '0.9rem', marginBottom: '0.5rem' }}></div>
      <div className="skeleton" style={{ width: '80%', height: '0.9rem', marginBottom: '1.2rem' }}></div>
      {/* লাইক বাটন */}
      <div className="skeleton" style={{ width: '60px', height: '2rem', borderRadius: '20px' }}></div>
    </div>
  );
}
