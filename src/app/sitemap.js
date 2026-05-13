import { createClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const supabase = await createClient();
  
  // তোমার ব্লগগুলো নিয়ে আসা হলো
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, created_at')
    .eq('approved', true);

  // স্ট্যাটিক পেজগুলোর তালিকা
  const staticPages = [
    { url: 'https://krishipath.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://krishipath.com/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://krishipath.com/forum', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://krishipath.com/bazar', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://krishipath.com/prices', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // প্রতিটি ব্লগের জন্য একটি করে এন্ট্রি তৈরি করা হলো
  const blogPages = blogs?.map((blog) => ({
    url: `https://krishipath.com/blog/${blog.id}`,
    lastModified: new Date(blog.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  })) || [];

  return [...staticPages, ...blogPages];
}