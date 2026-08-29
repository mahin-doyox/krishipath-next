'use client';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AnswerModal({ questionId, onClose, onAnswered }) {
  const { user, profile, supabase } = useAuth();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile || (profile.role !== 'expert' && profile.role !== 'admin')) {
    return null;
  }

  const submit = async () => {
    if (!answer.trim()) return alert('উত্তর লিখুন');
    setSubmitting(true);
    const { error } = await supabase.from('forum_answers').insert([{
      question_id: questionId,
      user_id: user.id,
      user_name: profile.name,
      answer: answer.trim(),
      approved: false
    }]);
    setSubmitting(false);

    if (error) {
      alert('উত্তর জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      return;
    }

    alert('উত্তর জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
    setAnswer('');
    onAnswered && onAnswered();
    onClose();
  };

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>উত্তর লিখুন</h3>
          <button 
            className="modal-close" 
            onClick={onClose}
            style={{ fontSize: '1.8rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
        <textarea
          className="form-control"
          rows="5"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="আপনার উত্তর লিখুন..."
          style={{ whiteSpace: 'pre-wrap' }}
          maxLength={2000}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
          <span>{answer.length}/2000</span>
        </div>
        <button 
          className="btn btn-primary w-100 mt-3" 
          onClick={submit}
          disabled={submitting || !answer.trim()}
        >
          {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
        </button>
      </div>
    </div>
  );
}
