'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/relativeTime';

// ✅ ফসলের টাইমলাইন কনফিগ — এটা ফাইলের উপরে থাকবে
const cropSchedules = {
  ধান: [
    { day: 0, task: 'রোপণ সম্পন্ন', type: 'planting' },
    { day: 3, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 7, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 15, task: 'ইউরিয়া সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 25, task: 'কীটনাশক স্প্রে করুন', type: 'pesticide' },
    { day: 35, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 45, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 60, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 90, task: 'ফসল কাটার প্রস্তুতি', type: 'harvesting' },
  ],
  গম: [
    { day: 0, task: 'বপন সম্পন্ন', type: 'planting' },
    { day: 15, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 30, task: 'ইউরিয়া সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 45, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 60, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 80, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 105, task: 'ফসল কাটা', type: 'harvesting' },
  ],
  আলু: [
    { day: 0, task: 'রোপণ সম্পন্ন', type: 'planting' },
    { day: 5, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 15, task: 'জৈব সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 25, task: 'কীটনাশক স্প্রে করুন', type: 'pesticide' },
    { day: 35, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 45, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 60, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 75, task: 'ফসল তোলা', type: 'harvesting' },
  ],
  পেঁয়াজ: [
    { day: 0, task: 'রোপণ সম্পন্ন', type: 'planting' },
    { day: 3, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 10, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 20, task: 'ইউরিয়া সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 30, task: 'কীটনাশক স্প্রে করুন', type: 'pesticide' },
    { day: 45, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 60, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 85, task: 'ফসল তোলা', type: 'harvesting' },
  ],
  টমেটো: [
    { day: 0, task: 'রোপণ সম্পন্ন', type: 'planting' },
    { day: 5, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 12, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 20, task: 'জৈব সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 30, task: 'কীটনাশক স্প্রে করুন', type: 'pesticide' },
    { day: 40, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 50, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 70, task: 'ফসল তোলা', type: 'harvesting' },
  ],
  মরিচ: [
    { day: 0, task: 'রোপণ সম্পন্ন', type: 'planting' },
    { day: 5, task: 'হালকা সেচ দিন', type: 'irrigation' },
    { day: 15, task: 'আগাছা পরিষ্কার করুন', type: 'weeding' },
    { day: 25, task: 'ইউরিয়া সার প্রয়োগ করুন', type: 'fertilizer' },
    { day: 35, task: 'কীটনাশক স্প্রে করুন', type: 'pesticide' },
    { day: 50, task: 'দ্বিতীয় সেচ দিন', type: 'irrigation' },
    { day: 65, task: 'ফলন পর্যবেক্ষণ করুন', type: 'observation' },
    { day: 85, task: 'ফসল তোলা', type: 'harvesting' },
  ],
};

const cropNames = ['ধান', 'গম', 'আলু', 'পেঁয়াজ', 'টমেটো', 'মরিচ'];

export default function MyCropsPage() {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cropName, setCropName] = useState('ধান');
  const [plantingDate, setPlantingDate] = useState('');
  const [landSize, setLandSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth?mode=login&redirect=/my-crops');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: plansData } = await supabase
        .from('crop_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const planIds = (plansData || []).map(p => p.id);

      if (planIds.length > 0) {
        const { data: tasksData } = await supabase
          .from('crop_tasks')
          .select('*')
          .in('plan_id', planIds)
          .order('task_date', { ascending: true });
        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }

      setPlans(plansData || []);
    } catch (err) {
      console.error('Load error:', err.message);
    }
    setLoading(false);
  };

  const addPlan = async () => {
    if (!user) return;
    if (!plantingDate) return alert('রোপণের তারিখ দিন');
    setAdding(true);

    try {
      const { data: plan, error: planError } = await supabase
        .from('crop_plans')
        .insert([{
          user_id: user.id,
          crop_name: cropName,
          planting_date: plantingDate,
          land_size: landSize,
          status: 'active',
        }])
        .select('id')
        .single();

      if (planError) {
        console.error('Plan insert error:', planError.message);
        alert('ফসল যোগ করতে সমস্যা হয়েছে: ' + planError.message);
        setAdding(false);
        return;
      }

      const schedule = cropSchedules[cropName] || cropSchedules['ধান'];
      const tasksToInsert = schedule.map(item => ({
        plan_id: plan.id,
        task_name: item.task,
        task_type: item.type,
        task_date: new Date(new Date(plantingDate).getTime() + item.day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      const { error: taskError } = await supabase.from('crop_tasks').insert(tasksToInsert);

      if (taskError) {
        console.error('Task insert error:', taskError.message);
        alert('টাস্ক তৈরিতে সমস্যা হয়েছে: ' + taskError.message);
      } else {
        alert('ফসল যোগ হয়েছে! আপনার টাইমলাইন প্রস্তুত।');
        setLandSize('');
        setPlantingDate('');
        loadData();
      }
    } catch (err) {
      console.error('Server error:', err);
      alert('সার্ভার ত্রুটি: ' + (err.message || 'অজানা ত্রুটি'));
    }
    setAdding(false);
  };

  const toggleTask = async (taskId, currentStatus) => {
    const { error } = await supabase
      .from('crop_tasks')
      .update({
        is_completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) {
      alert('টাস্ক আপডেট করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      loadData();
    }
  };

  if (!user) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => !t.is_completed && t.task_date === todayStr);
  const upcomingTasks = tasks.filter(t => !t.is_completed && new Date(t.task_date) > new Date());
  const completedTasks = tasks.filter(t => t.is_completed);

  return (
    <div className="container" style={{ padding: '1.5rem 0 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="section-title">🌱 আমার ফসল</h2>

      {/* ফসল যোগ ফর্ম */}
      <div className="form-card">
        <h3>নতুন ফসল যোগ করুন</h3>
        <select className="form-control" value={cropName} onChange={e => setCropName(e.target.value)}>
          {cropNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          className="form-control mt-3"
          value={plantingDate}
          onChange={e => setPlantingDate(e.target.value)}
          max={todayStr}
        />
        <input
          type="text"
          className="form-control mt-3"
          placeholder="জমির পরিমাণ (ঐচ্ছিক, যেমন: ২ বিঘা)"
          value={landSize}
          onChange={e => setLandSize(e.target.value)}
        />
        <button className="btn btn-primary w-100 mt-3" onClick={addPlan} disabled={adding}>
          {adding ? 'যোগ হচ্ছে...' : 'ফসল যোগ করুন'}
        </button>
      </div>

      {/* আজকের কাজ */}
      {todayTasks.length > 0 && (
        <div className="form-card" style={{ marginTop: '1.5rem' }}>
          <h3>📌 আজকের কাজ</h3>
          {todayTasks.map(task => (
            <div key={task.id} className="flex-row" style={{ justifyContent: 'space-between' }}>
              <span>{task.task_name}</span>
              <button className="btn btn-sm btn-outline" onClick={() => toggleTask(task.id, task.is_completed)}>
                সম্পন্ন
              </button>
            </div>
          ))}
        </div>
      )}

      {/* চলমান ফসল */}
      <h3 className="section-title" style={{ fontSize: '1.3rem' }}>চলমান ফসল</h3>
      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>লোড হচ্ছে...</p>
      ) : plans.length > 0 ? (
        <div className="card-grid">
          {plans.map(plan => {
            const planTasks = tasks.filter(t => t.plan_id === plan.id);
            const completed = planTasks.filter(t => t.is_completed).length;
            const progress = planTasks.length > 0 ? Math.round((completed / planTasks.length) * 100) : 0;
            return (
              <div key={plan.id} className="feature-card" style={{ textAlign: 'left' }}>
                <h4>{plan.crop_name}</h4>
                <small>রোপণ: {new Date(plan.planting_date).toLocaleDateString('bn-BD')}</small>
                {plan.land_size && <small style={{ display: 'block' }}>জমি: {plan.land_size}</small>}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ background: '#e0e0e0', borderRadius: '10px', height: '8px' }}>
                    <div style={{ width: `${progress}%`, background: 'var(--primary)', borderRadius: '10px', height: '8px' }}></div>
                  </div>
                  <small>{progress}% সম্পন্ন</small>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#888' }}>কোনো চলমান ফসল নেই</p>
      )}

      {/* আসন্ন কাজ */}
      {upcomingTasks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.3rem' }}>আসন্ন কাজ</h3>
          {upcomingTasks.slice(0, 5).map(task => (
            <div key={task.id} className="pending-item">
              <span>{task.task_name}</span>
              <small>{new Date(task.task_date).toLocaleDateString('bn-BD')}</small>
            </div>
          ))}
        </div>
      )}

      {/* সম্পন্ন কাজ */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.3rem' }}>✅ সম্পন্ন কাজ</h3>
          {completedTasks.slice(0, 10).map(task => (
            <div key={task.id} className="pending-item" style={{ background: '#f0f7f0' }}>
              <span>{task.task_name}</span>
              <small>{new Date(task.completed_at).toLocaleDateString('bn-BD')}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
