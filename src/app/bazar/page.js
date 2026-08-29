import { createClient } from '@/lib/supabase/server';
import BazarClient from './BazarClient';

export const metadata = {
  title: 'কৃষিবাজার - কৃষিপথ',
  description: 'কৃষকের পণ্য সরাসরি কিনুন',
  openGraph: {
    title: 'কৃষিবাজার - কৃষিপথ',
    description: 'কৃষকের পণ্য সরাসরি কিনুন',
  },
};

export default async function BazarPage() {
  const supabase = await createClient();
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error.message);
  }

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title">কৃষিবাজার</h2>
      <BazarClient products={products || []} />
    </div>
  );
}
