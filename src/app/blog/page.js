import { createClient } from '@/lib/supabase/server';
import BlogFilterClient from './BlogFilterClient'; // ক্লায়েন্ট কম্পোনেন্ট

export const metadata = {
  title: 'কৃষি ব্লগ - কৃষিপথ',
  description: 'কৃষি বিষয়ক বিশেষজ্ঞ লেখা ও অভিজ্ঞতা শেয়ারিং',
};

export default async function BlogPage() {
  const supabase = await createClient();  // await যোগ করো
  const { data: blogs } = await supabase.from('blogs').select('*').eq('approved', true).order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">কৃষি ব্লগ</h2>
      <BlogFilterClient blogs={blogs || []} />
    </div>
  );
}