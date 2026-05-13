'use client';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AnswerModal({ questionId, onClose, onAnswered }) {
  const { user, profile, supabase } = useAuth();
  const [answer, setAnswer] = useState('');

  if (!user || !profile || (profile.role !== 'expert' && profile.role !== 'admin')) {
    return null; // modal should not appear if not allowed
  }

  const submit = async () => {
    if (!answer.trim()) return alert('উত্তর লিখুন');
    await supabase.from('forum_answers').insert([{
      question_id: questionId,
      user_id: user.id,
      user_name: profile.name,
      answer: answer.trim(),
      approved: false
    }]);
    alert('উত্তর জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।');
    setAnswer('');
    onAnswered && onAnswered();
    onClose();
  };

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>উত্তর লিখুন</h3>
        <textarea
          className="form-control"
          rows="5"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="আপনার উত্তর"
        ></textarea>
        <button className="btn btn-primary w-100 mt-3" onClick={submit}>জমা দিন</button>
      </div>
    </div>
  );
}