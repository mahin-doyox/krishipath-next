import { createClient } from '@/lib/supabase/server';
import BazarClient from './BazarClient';

export const metadata = {
  title: 'কৃষিবাজার - কৃষিপথ',
  description: 'কৃষকের পণ্য সরাসরি কিনুন',
};

export default async function BazarPage() {
  const supabase = await createClient();  // await যোগ করো;
  const { data: products } = await supabase.from('products').select('*').eq('approved', true).order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">কৃষিবাজার</h2>
      <BazarClient products={products || []} />
    </div>
  );
}