import Link from 'next/link';

export default function BlogCard({ blog }) {
  return (
    <div className="feature-card">
      <Link href={`/blog/${blog.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h4>{blog.title}</h4>
      </Link>
      <small>{blog.category} — {blog.user_name}</small>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>{blog.content?.slice(0, 200)}{blog.content?.length > 200 ? '...' : ''}</div>
    </div>
  );
}