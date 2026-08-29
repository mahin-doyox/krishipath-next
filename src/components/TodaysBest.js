{latestBlog && (
  <a href={`/blog/${latestBlog.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
    <div className="feature-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📝 সর্বশেষ ব্লগ</h3>
      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{latestBlog.title}</h4>
      <small style={{ color: '#666' }}>
        {latestBlog.user_name} • {getRelativeTime(latestBlog.created_at)}
      </small>
    </div>
  </a>
)}
