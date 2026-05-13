import { createClient } from '@/lib/supabase/server';
import ForumClient from './ForumClient';

export const metadata = {
  title: 'প্রশ্নোত্তর - কৃষিপথ',
  description: 'কৃষি বিষয়ক প্রশ্ন করুন এবং বিশেষজ্ঞদের উত্তর পান',
};

export default async function ForumPage() {
  const supabase = await createClient();  // await যোগ করো
  const { data: questions } = await supabase.from('forum_questions').select('*').eq('approved', true).order('created_at', { ascending: false });
  // Fetch answers for each question separately in client to avoid heavy join, but for SSR we can also get all answers.
  // We'll pass questions and let client fetch answers.
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h2 className="section-title">প্রশ্নোত্তর</h2>
      <ForumClient questions={questions || []} />
    </div>
  );
}