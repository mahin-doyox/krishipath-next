'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AnswerModal from '@/components/AnswerModal';

export default function ForumClient({ questions }) {
  const { user, profile, supabase } = useAuth();
  const [data, setData] = useState(questions);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answersMap, setAnswersMap] = useState({});
  const [modalQId, setModalQId] = useState(null);

  useEffect(() => {
    // Load answers for each question
    questions.forEach(async q => {
      const { data: ans } = await supabase.from('forum_answers').select('*').eq('question_id', q.id).eq('approved', true).order('created_at', { ascending: true });
      setAnswersMap(prev => ({ ...prev, [q.id]: ans }));
    });
  }, [questions]);

  const askQuestion = async () => {
    if (!title || !body) return alert('বিষয় ও বিবরণ দিন');
    if (!user || !profile) return alert('প্রশ্ন করতে লগইন করুন।');
    await supabase.from('forum_questions').insert([{ title, body, user_id: user.id, user_name: profile.name, approved: true }]);
    alert('প্রশ্ন জমা হয়েছে');
    setTitle(''); setBody('');
    // refetch
    const { data: updated } = await supabase.from('forum_questions').select('*').eq('approved', true).order('created_at', { ascending: false });
    setData(updated || []);
  };

  const openAnswerModal = (qid) => {
    if (!user) return alert('উত্তর দিতে লগইন করুন।');
    if (!profile || (profile.role !== 'expert' && profile.role !== 'admin')) return alert('শুধুমাত্র কৃষিবিদ ও অ্যাডমিন উত্তর দিতে পারেন।');
    setModalQId(qid);
  };

  const refreshAnswers = async (qid) => {
    const { data: ans } = await supabase.from('forum_answers').select('*').eq('question_id', qid).eq('approved', true).order('created_at', { ascending: true });
    setAnswersMap(prev => ({ ...prev, [qid]: ans }));
  };

  return (
    <>
      {user && (profile?.role === 'expert' || profile?.role === 'admin') && (
        <div className="form-card">
          <h3>ব্লগ লিখুন</h3>
          <input className="form-control" placeholder="শিরোনাম" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="form-control mt-3" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="ফসল">ফসল</option>
            <option value="মৎস্য">মৎস্য</option>
            <option value="পশুপালন">পশুপালন</option>
            <option value="জৈব সার">জৈব সার</option>
          </select>
          <textarea className="form-control mt-3" rows="5" placeholder="আপনার লেখা" value={content} onChange={e => setContent(e.target.value)}></textarea>
          <button className="btn btn-primary w-100 mt-3" onClick={uploadBlog}>প্রকাশ করুন</button>
        </div>
      )}
      <div>
        {data.map(q => (
          <div key={q.id} className="feature-card">
            <h4>{q.title}</h4>
            <p>{q.body}</p>
            <small>— {q.user_name}</small>
            <div className="mt-3">
              <strong>উত্তর ({(answersMap[q.id] || []).length}):</strong>
              {(answersMap[q.id] || []).map(a => (
                <p key={a.id}>{a.answer} <small>— {a.user_name}</small></p>
              ))}
            </div>
            <button className="btn btn-outline btn-sm mt-2" onClick={() => openAnswerModal(q.id)}>উত্তর দিন</button>
          </div>
        ))}
      </div>
      {modalQId && (
        <AnswerModal
          questionId={modalQId}
          onClose={() => setModalQId(null)}
          onAnswered={() => refreshAnswers(modalQId)}
        />
      )}
    </>
  );
}