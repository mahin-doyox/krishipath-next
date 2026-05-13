'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AnswerModal from '@/components/AnswerModal';

export default function ForumClient({ questions }) {
  const { user, profile, supabase } = useAuth();
  const [data, setData] = useState(questions);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answersMap, setAnswersMap] = useState({});
  const [modalQId, setModalQId] = useState(null);

  // Load answers for each question
  useEffect(() => {
    questions.forEach(async (q) => {
      const { data: ans } = await supabase
        .from('forum_answers')
        .select('*')
        .eq('question_id', q.id)
        .eq('approved', true)
        .order('created_at', { ascending: true });
      setAnswersMap((prev) => ({ ...prev, [q.id]: ans }));
    });
  }, [questions, supabase]);

  const askQuestion = async () => {
    if (!title || !body) return alert('বিষয় ও বিবরণ দিন');
    if (!user || !profile) return alert('প্রশ্ন করতে লগইন করুন।');
    await supabase.from('forum_questions').insert([
      {
        title,
        body,
        user_id: user.id,
        user_name: profile.name,
        approved: true,
      },
    ]);
    alert('প্রশ্ন জমা হয়েছে');
    setTitle('');
    setBody('');
    // Refresh questions
    const { data: updated } = await supabase
      .from('forum_questions')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    setData(updated || []);
  };

  const openAnswerModal = (qid) => {
    if (!user) return alert('উত্তর দিতে লগইন করুন।');
    if (!profile || (profile.role !== 'expert' && profile.role !== 'admin'))
      return alert('শুধুমাত্র কৃষিবিদ ও অ্যাডমিন উত্তর দিতে পারেন।');
    setModalQId(qid);
  };

  const refreshAnswers = async (qid) => {
    const { data: ans } = await supabase
      .from('forum_answers')
      .select('*')
      .eq('question_id', qid)
      .eq('approved', true)
      .order('created_at', { ascending: true });
    setAnswersMap((prev) => ({ ...prev, [qid]: ans }));
  };

  return (
    <>
      {/* প্রশ্ন করার ফর্ম */}
      {user && (profile?.role === 'farmer' || profile?.role === 'admin' || profile?.role === 'businessman' || profile?.role === 'expert' || profile?.role === 'agent') && (
        <div className="form-card">
          <h3>প্রশ্ন জিজ্ঞাসা</h3>
          <input
            className="form-control"
            placeholder="বিষয়"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="form-control mt-3"
            rows="4"
            placeholder="বিস্তারিত"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          ></textarea>
          <button className="btn btn-primary w-100 mt-3" onClick={askQuestion}>
            জিজ্ঞাসা করুন
          </button>
        </div>
      )}

      {/* প্রশ্ন তালিকা */}
      {data.map((q) => (
        <div key={q.id} className="feature-card">
          <h4>{q.title}</h4>
          <p>{q.body}</p>
          <small>— {q.user_name}</small>
          <div className="mt-3">
            <strong>উত্তর ({(answersMap[q.id] || []).length}):</strong>
            {(answersMap[q.id] || []).map((a) => (
              <p key={a.id}>
                {a.answer} <small>— {a.user_name}</small>
              </p>
            ))}
          </div>
          <button
            className="btn btn-outline btn-sm mt-2"
            onClick={() => openAnswerModal(q.id)}
          >
            উত্তর দিন
          </button>
        </div>
      ))}
      {data.length === 0 && <p>কোনো প্রশ্ন নেই</p>}

      {/* উত্তর মডাল */}
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