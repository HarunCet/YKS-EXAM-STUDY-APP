'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Task = {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'mid' | 'low';
};

interface GoalsAndPlansProps {
  initialTasks: Task[];
  initialSubjectNotes: Record<string, string>;
  isGuest?: boolean;
}

const subjectMeta: Record<string, { icon: string; color: string; bg: string; darkBg: string; border: string }> = {
  matematik: { icon: '📐', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50', darkBg: 'dark:bg-blue-950/10', border: 'border-blue-100 dark:border-blue-950/30' },
  fizik: { icon: '⚛️', color: 'text-purple-650 dark:text-purple-400', bg: 'bg-purple-50/50', darkBg: 'dark:bg-purple-950/10', border: 'border-purple-100 dark:border-purple-950/30' },
  kimya: { icon: '🧪', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50', darkBg: 'dark:bg-emerald-950/10', border: 'border-emerald-100 dark:border-emerald-950/30' },
  biyoloji: { icon: '🧬', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-950/10', border: 'border-rose-100 dark:border-rose-950/30' },
  dil_bilgisi: { icon: '✍️', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-950/10', border: 'border-amber-100 dark:border-amber-950/30' },
};

const priorityMeta = {
  high: { label: 'Acil', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30' },
  mid:  { label: 'Normal', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30' },
  low:  { label: 'Sonra', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' },
};

export default function GoalsAndPlans({ initialTasks, initialSubjectNotes, isGuest = false }: GoalsAndPlansProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const formatSubjectName = (key: string) => {
    const name = key.replace('tyt_', '').replace('ayt_', '').replace('_konulari', '').replace('_', ' ');
    if (name.toLowerCase() === 'dil bilgisi') return 'Türkçe Dil Bilgisi';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getSubjectMeta = (key: string) => {
    const name = key.replace('tyt_', '').replace('ayt_', '').replace('_konulari', '').toLowerCase();
    return subjectMeta[name] || { icon: '📚', color: 'text-zinc-600', bg: 'bg-zinc-50', darkBg: 'dark:bg-zinc-900', border: 'border-zinc-200' };
  };

  const activeNotes = useMemo(() => {
    return Object.entries(initialSubjectNotes)
      .filter(([_, note]) => note?.trim())
      .map(([key, note]) => ({
        key,
        name: formatSubjectName(key),
        note: note.trim(),
        meta: getSubjectMeta(key),
      }));
  }, [initialSubjectNotes]);

  const toggleTask = async (id: string) => {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(nextTasks);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentMeta = user?.user_metadata || {};
      
      await supabase.auth.updateUser({
        data: {
          ...currentMeta,
          tasks: nextTasks
        }
      });
    } catch (err) {
      console.error("Görev durumu güncellenirken hata oluştu:", err);
      setTasks(tasks); // Rollback
    } finally {
      setSaving(false);
    }
  };

  const sortedTasks = useMemo(() => {
    const order: Record<Task['priority'], number> = { high: 0, mid: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return order[a.priority] - order[b.priority];
    });
  }, [tasks]);

  const taskStats = useMemo(() => {
    const done = tasks.filter(t => t.done).length;
    return { done, total: tasks.length };
  }, [tasks]);

  const taskProgressPercent = taskStats.total
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  return (
    <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 relative overflow-hidden">
      {isGuest && (
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/80 backdrop-blur-sm z-30 flex flex-col justify-center items-center p-6 text-center select-none animate-fadeIn">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-zinc-700 flex items-center justify-center text-3xl mx-auto shadow-inner animate-pulse">
              🔒
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-150">
                Kişisel Çalışma Paneli & Görev Takibi
              </h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold">
                Haftalık hedeflerinizi belirlemek, ders bazlı çalışma notlarınızı bulutta saklamak ve ilerleme durumunuzu takip edebilmek için ücretsiz üye olun veya giriş yapın.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Giriş Yap / Üye Ol
            </Link>
          </div>
        </div>
      )}
      
      {/* Title & Status Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-150 dark:border-zinc-800 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🎯</span> Çalışma Hedeflerin & Notların
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Müfredat üzerinden belirlediğin hedefler ve ders bazlı notların.
          </p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          {saving && (
            <span className="text-xs text-blue-500 font-medium animate-pulse flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-950/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Kaydediliyor...
            </span>
          )}
          <Link
            href="/calisma-paneli"
            className="text-xs bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold transition-all flex items-center gap-1"
          >
            Tümünü Düzenle →
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Tasks */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <span>📋</span> Haftalık Görevler
            </h3>
            {taskStats.total > 0 && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-100/50 dark:border-blue-950/50">
                {taskStats.done} / {taskStats.total} Tamamlandı
              </span>
            )}
          </div>

          {taskStats.total > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Progress Bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>

              {/* Task Items */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {sortedTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                      task.done
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-150 dark:border-zinc-850 opacity-70'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-sm'
                    }`}
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                        task.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400'
                      }`}>
                        {task.done && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed transition-all break-words ${
                        task.done ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200 font-semibold'
                      }`}>
                        {task.text}
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityMeta[task.priority].badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority].dot}`} />
                        {priorityMeta[task.priority].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Link
              href="/calisma-paneli"
              className="flex-1 min-h-[180px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-blue-400 dark:hover:border-blue-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20 transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</span>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-250 text-sm">Haftalık Görev Ekleyin</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                Bu hafta yapacaklarınızı listeleyin ve hedefler belirleyin.
              </p>
            </Link>
          )}
        </div>

        {/* Right Column: Subject Notes */}
        <div className="flex flex-col">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mb-4">
            <span>📝</span> Ders Notlarım
          </h3>

          {activeNotes.length > 0 ? (
            <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1">
              {activeNotes.map(item => (
                <Link
                  key={item.key}
                  href={`/calisma-paneli?subject=${item.key}`}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${item.meta.bg} ${item.meta.darkBg} ${item.meta.border} hover:shadow-sm hover:scale-[1.01]`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 flex items-center justify-center text-lg shadow-sm shrink-0">
                    {item.meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                      {item.name}
                    </h4>
                    <p className="text-xs text-zinc-655 dark:text-zinc-350 mt-1 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {item.note}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href="/calisma-paneli"
              className="flex-1 min-h-[180px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-amber-400 dark:hover:border-amber-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/20 transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-250 text-sm">Ders Notu Ekleyin</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                Çalışırken karşılaştığın zorlukları ve önemli formülleri not al.
              </p>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
