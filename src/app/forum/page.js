import { createClient } from '@/lib/supabase/server';
import ForumClient from './ForumClient';

export const metadata = {
  title: 'প্রশ্নোত্তর - কৃষিপথ',
  description: 'কৃষি বিষয়ক প্রশ্ন করুন এবং বিশেষজ্ঞদের উত্তর পান',
  openGraph: {
    title: 'প্রশ্নোত্তর - কৃষিপথ',
    description: 'কৃষি বিষয়ক প্রশ্ন করুন এবং বিশেষজ্ঞদের উত্তর পান',
  },
};

export default async function ForumPage() {
  const supabase = await createClient();
  
  const { data: questions, error } = await supabase
    .from('forum_questions')
    .select('id,title,body,user_id,user_name,approved,created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error.message);
  }

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
      <h2 className="section-title">প্রশ্নোত্তর</h2>
      <ForumClient questions={questions || []} />
    </div>
  );
}
