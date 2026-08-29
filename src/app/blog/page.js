import { createClient } from '@/lib/supabase/server';
import BlogFilterClient from './BlogFilterClient';

export const metadata = {
  title: 'কৃষি ব্লগ - কৃষিপথ',
  description: 'কৃষি বিষয়ক বিশেষজ্ঞ লেখা ও অভিজ্ঞতা শেয়ারিং',
  openGraph: {
    title: 'কৃষি ব্লগ - কৃষিপথ',
    description: 'কৃষি বিষয়ক বিশেষজ্ঞ লেখা ও অভিজ্ঞতা শেয়ারিং',
  },
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('id,title,content,category,user_name,approved,created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blogs:', error.message);
  }

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title">কৃষি ব্লগ</h2>
      <BlogFilterClient blogs={blogs || []} />
    </div>
  );
}
