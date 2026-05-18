export default function BlogCardSkeleton() {
  return (
    <div className="feature-card skeleton-card">
      <div className="skeleton" style={{ width: '80%', height: '1.5rem', marginBottom: '0.5rem' }}></div>
      <div className="skeleton" style={{ width: '60%', height: '1rem', marginBottom: '1rem' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '3rem' }}></div>
    </div>
  );
}
