'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AnswerModal from '@/components/AnswerModal';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/relativeTime';

export default function ForumClient({ questions }) {
  const { user, profile, supabase } = useAuth();
  const [data, setData] = useState(questions);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answersMap, setAnswersMap] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [userLikes, setUserLikes] = useState({});
  const [modalQId, setModalQId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setData(questions);
  }, [questions]);

  useEffect(() => {
    const fetchAnswersAndLikes = async () => {
      for (const q of questions) {
        const { data: ans } = await supabase
          .from('forum_answers')
          .select('id,question_id,user_id,user_name,answer,approved,created_at')
          .eq('question_id', q.id)
          .eq('approved', true)
          .order('created_at', { ascending: true });
        setAnswersMap((prev) => ({ ...prev, [q.id]: ans || [] }));

        ans?.forEach((a) => {
          supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('item_type', 'answer')
            .eq('item_id', a.id)
            .then(({ count }) => setLikeCounts((prev) => ({ ...prev, [a.id]: count || 0 })));

          if (user) {
            supabase
              .from('likes')
              .select('id')
              .eq('user_id', user.id)
              .eq('item_type', 'answer')
              .eq('item_id', a.id)
              .limit(1)
              .maybeSingle()
              .then(({ data: likeData }) => setUserLikes((prev) => ({ ...prev, [a.id]: !!likeData })));
          }
        });
      }
    };
    fetchAnswersAndLikes();
  }, [questions, user, supabase]);

  // রিয়েল-টাইম লাইক আপডেট (ইরর হ্যান্ডলিং সহ)
  useEffect(() => {
    let channel;
    try {
      channel = supabase
        .channel('forum-answer-likes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'likes', filter: 'item_type=eq.answer' },
          (payload) => {
            const itemId = payload.new?.item_id || payload.old?.item_id;
            if (itemId) {
              supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('item_type', 'answer')
                .eq('item_id', itemId)
                .then(({ count }) => setLikeCounts((prev) => ({ ...prev, [itemId]: count || 0 })));
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed:', err.message);
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [supabase]);

  const askQuestion = async () => {
    if (!user || !profile) return alert('প্রশ্ন করতে লগইন করুন।');
    if (!title.trim() || !body.trim()) return alert('বিষয় ও বিবরণ দিন');
    setAsking(true);
    const { error } = await supabase.from('forum_questions').insert([
      { title: title.trim(), body: body.trim(), user_id: user.id, user_name: profile.name, approved: true },
    ]);
    setAsking(false);
    if (error) {
      alert('প্রশ্ন জমা দিতে সমস্যা হয়েছে।');
      return;
    }
    alert('প্রশ্ন জমা হয়েছে');
    setTitle(''); setBody('');
    const { data: updated } = await supabase
      .from('forum_questions')
      .select('id,title,body,user_id,user_name,approved,created_at')
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
      .select('id,question_id,user_id,user_name,answer,approved,created_at')
      .eq('question_id', qid)
      .eq('approved', true)
      .order('created_at', { ascending: true });
    setAnswersMap((prev) => ({ ...prev, [qid]: ans || [] }));
  };

  const toggleAnswerLike = async (answerId) => {
    if (!user) return alert('লাইক দিতে লগইন করুন।');
    if (userLikes[answerId]) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', 'answer')
        .eq('item_id', answerId);
    } else {
      await supabase.from('likes').insert({
        user_id: user.id,
        item_type: 'answer',
        item_id: answerId,
      });
    }
  };

  const filteredQuestions = searchTerm.trim()
    ? data.filter(
        (q) =>
          q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.body?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  return (
    <>
      {/* সার্চ ইনপুট */}
      <div className="form-card" style={{ marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 প্রশ্ন খুঁজুন (বিষয় বা বিবরণ)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
            {filteredQuestions.length} টি প্রশ্ন পাওয়া গেছে
          </p>
        )}
      </div>

      {/* প্রশ্ন ফর্ম বা লগইন প্রম্পট */}
      {user ? (
        <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          <h3>প্রশ্ন জিজ্ঞাসা</h3>
          <input
            className="form-control"
            placeholder="বিষয়"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <textarea
            className="form-control mt-3"
            rows="4"
            placeholder="বিস্তারিত"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ whiteSpace: 'pre-wrap' }}
          ></textarea>
          <button className="btn btn-primary w-100 mt-3" onClick={askQuestion} disabled={asking}>
            {asking ? 'জমা হচ্ছে...' : 'জিজ্ঞাসা করুন'}
          </button>
        </div>
      ) : (
        <div className="form-card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          <p>
            প্রশ্ন করতে{' '}
            <Link href="/auth?mode=login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              লগইন
            </Link>{' '}
            করুন।
          </p>
        </div>
      )}

      {/* প্রশ্ন তালিকা */}
      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((q) => (
          <div key={q.id} className="feature-card" style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto 1rem' }}>
            <h4 style={{ fontSize: '1.2rem' }}>{q.title}</h4>
            <p style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0' }}>{q.body}</p>
            <small style={{ color: '#666' }}>
              — {q.user_name} • {getRelativeTime(q.created_at)}
            </small>
            <div className="mt-3">
              <strong>উত্তর ({(answersMap[q.id] || []).length}):</strong>
              {(answersMap[q.id] || []).map((a) => (
                <div
                  key={a.id}
                  className="answer-box"
                  style={{
                    marginBottom: '0.8rem',
                    marginTop: '0.5rem',
                    padding: '0.8rem',
                    borderRadius: '12px',
                  }}
                >
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{a.answer}</p>
                  <small style={{ color: '#666' }}>
                    — {a.user_name} • {getRelativeTime(a.created_at)}
                  </small>
                  <div style={{ marginTop: '0.3rem' }}>
                    <button
                      className={`btn btn-sm ${userLikes[a.id] ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleAnswerLike(a.id)}
                    >
                      <i className={`${userLikes[a.id] ? 'fas' : 'far'} fa-heart`}></i>{' '}
                      {likeCounts[a.id] || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm mt-2" onClick={() => openAnswerModal(q.id)}>
              উত্তর দিন
            </button>
          </div>
        ))
      ) : (
        <div className="form-card" style={{ textAlign: 'center' }}>
          <p>
            কোনো প্রশ্ন পাওয়া যায়নি।{' '}
            {!searchTerm && (
              <>
                <Link href="/auth?mode=login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  লগইন করুন
                </Link>{' '}
                এবং প্রথম প্রশ্ন করুন।
              </>
            )}
          </p>
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
