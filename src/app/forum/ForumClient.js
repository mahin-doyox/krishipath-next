'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AnswerModal from '@/components/AnswerModal';
import Link from 'next/link';

export default function ForumClient({ questions }) {
  const { user, profile, supabase } = useAuth();
  const [data, setData] = useState(questions);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answersMap, setAnswersMap] = useState({});
  const [likeCounts, setLikeCounts] = useState({});   // answer_id -> count
  const [userLikes, setUserLikes] = useState({});      // answer_id -> boolean
  const [modalQId, setModalQId] = useState(null);

  // প্রশ্ন লোড
  useEffect(() => {
    setData(questions);
  }, [questions]);

  // উত্তর ও লাইক লোড
  useEffect(() => {
    questions.forEach(async (q) => {
      const { data: ans } = await supabase
        .from('forum_answers')
        .select('*')
        .eq('question_id', q.id)
        .eq('approved', true)
        .order('created_at', { ascending: true });
      setAnswersMap((prev) => ({ ...prev, [q.id]: ans || [] }));

      ans?.forEach((a) => {
        // লাইক কাউন্ট
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('item_type', 'answer')
          .eq('item_id', a.id)
          .then(({ count }) => setLikeCounts((prev) => ({ ...prev, [a.id]: count || 0 })));

        // ইউজার লাইক স্ট্যাটাস
        if (user) {
          supabase
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', 'answer')
            .eq('item_id', a.id)
            .single()
            .then(({ data: likeData }) => setUserLikes((prev) => ({ ...prev, [a.id]: !!likeData })));
        }
      });
    });
  }, [questions, user, supabase]);

  // রিয়েল-টাইম
  useEffect(() => {
    const channel = supabase
      .channel('answer-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: 'item_type=eq.answer' },
        (payload) => {
          const itemId = payload.new?.item_id || payload.old?.item_id;
          supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('item_type', 'answer')
            .eq('item_id', itemId)
            .then(({ count }) => setLikeCounts((prev) => ({ ...prev, [itemId]: count || 0 })));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [supabase]);

  const askQuestion = async () => {
    if (!user || !profile) return alert('প্রশ্ন করতে লগইন করুন।');
    if (!title.trim() || !body.trim()) return alert('বিষয় ও বিবরণ দিন');
    await supabase.from('forum_questions').insert([{
      title, body, user_id: user.id, user_name: profile.name, approved: true,
    }]);
    alert('প্রশ্ন জমা হয়েছে');
    setTitle(''); setBody('');
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
    setAnswersMap((prev) => ({ ...prev, [qid]: ans || [] }));
  };

  const toggleAnswerLike = async (answerId) => {
    if (!user) return alert('লাইক দিতে লগইন করুন।');
    if (userLikes[answerId]) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('item_type', 'answer').eq('item_id', answerId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, item_type: 'answer', item_id: answerId });
    }
  };

  return (
    <>
      {user ? (
        <div className="form-card">
          <h3>প্রশ্ন জিজ্ঞাসা</h3>
          <input className="form-control" placeholder="বিষয়" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="form-control mt-3" rows="4" placeholder="বিস্তারিত" value={body} onChange={e => setBody(e.target.value)} style={{ whiteSpace: 'pre-wrap' }}></textarea>
          <button className="btn btn-primary w-100 mt-3" onClick={askQuestion}>জিজ্ঞাসা করুন</button>
        </div>
      ) : (
        <div className="form-card" style={{ textAlign: 'center' }}>
          <p>প্রশ্ন করতে <Link href="/auth?mode=login" style={{ color: 'var(--primary)', fontWeight: 600 }}>লগইন</Link> করুন।</p>
        </div>
      )}

      {data.length > 0 ? data.map(q => (
        <div key={q.id} className="feature-card" style={{ textAlign: 'left' }}>
          <h4>{q.title}</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{q.body}</p>
          <small>— {q.user_name}</small>
          <div className="mt-3">
            <strong>উত্তর ({(answersMap[q.id] || []).length}):</strong>
            {(answersMap[q.id] || []).map(a => (
              <div key={a.id} style={{ marginBottom: '0.8rem', padding: '0.5rem', background: '#f8faf5', borderRadius: '12px' }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{a.answer}</p>
                <small>— {a.user_name}</small>
                <div style={{ marginTop: '0.3rem' }}>
                  <button
                    className={`btn btn-sm ${userLikes[a.id] ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => toggleAnswerLike(a.id)}
                  >
                    <i className={`${userLikes[a.id] ? 'fas' : 'far'} fa-heart`}></i> {likeCounts[a.id] || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline btn-sm mt-2" onClick={() => openAnswerModal(q.id)}>উত্তর দিন</button>
        </div>
      )) : (
        <div className="form-card" style={{ textAlign: 'center' }}>
          <p>কোনো প্রশ্ন নেই। <Link href="/auth?mode=login" style={{ color: 'var(--primary)', fontWeight: 600 }}>লগইন করুন</Link> এবং প্রথম প্রশ্ন করুন।</p>
        </div>
      )}

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
