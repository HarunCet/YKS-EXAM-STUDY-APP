'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Task = {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'mid' | 'low';
};

interface CalismaPaneliClientProps {
  initialTasks: Task[];
  initialSubjectNotes: Record<string, string>;
  userEmail: string;
}

const subjectMeta: Record<string, { icon: string; label: string; color: string; bg: string; border: string; focusRing: string }> = {
  matematik: { icon: '📐', label: 'Matematik', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/10', border: 'border-blue-100 dark:border-blue-900/30', focusRing: 'focus:ring-blue-500' },
  fizik: { icon: '⚛️', label: 'Fizik', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-950/10', border: 'border-purple-100 dark:border-purple-900/30', focusRing: 'focus:ring-purple-500' },
  kimya: { icon: '🧪', label: 'Kimya', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/10', border: 'border-emerald-100 dark:border-emerald-900/30', focusRing: 'focus:ring-emerald-500' },
  biyoloji: { icon: '🧬', label: 'Biyoloji', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-950/10', border: 'border-rose-100 dark:border-rose-900/30', focusRing: 'focus:ring-rose-500' },
  dil_bilgisi: { icon: '✍️', label: 'Türkçe Dil Bilgisi', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-950/10', border: 'border-amber-100 dark:border-amber-900/30', focusRing: 'focus:ring-amber-500' },
};

const priorityMeta = {
  high: { label: 'Acil', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30' },
  mid:  { label: 'Normal', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30' },
  low:  { label: 'Sonra', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' },
};

const subjectKeys = [
  { key: 'tyt_matematik_konulari', id: 'matematik' },
  { key: 'tyt_fizik_konulari', id: 'fizik' },
  { key: 'tyt_kimya_konulari', id: 'kimya' },
  { key: 'tyt_biyoloji_konulari', id: 'biyoloji' },
  { key: 'tyt_dil_bilgisi_konulari', id: 'dil_bilgisi' }
] as const;

export default function CalismaPaneliClient({ initialTasks, initialSubjectNotes, userEmail }: CalismaPaneliClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>(initialSubjectNotes);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>('tyt_matematik_konulari');
  
  // Task manager state
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('mid');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed' | 'high'>('all');
  
  // Sync status
  const [saving, setSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  
  // Editor state helper
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subjectParam = params.get('subject');
      if (subjectParam && subjectKeys.some(s => s.key === subjectParam)) {
        setSelectedSubjectKey(subjectParam);
      }
    }
  }, []);

  // Persist all data to metadata db
  const persistTasks = async (nextTasks: Task[]) => {
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
      console.error('Görevler senkronize edilemedi:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Task Actions ──────────────────────────────────
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      done: false,
      priority: newTaskPriority,
    };
    const next = [task, ...tasks];
    setTasks(next);
    setNewTaskText('');
    persistTasks(next);
  };

  const handleToggleTask = (id: string) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(next);
    persistTasks(next);
  };

  const handleDeleteTask = (id: string) => {
    const next = tasks.filter(t => t.id !== id);
    setTasks(next);
    persistTasks(next);
  };

  // ── Notes Auto-save ───────────────────────────────
  const handleNoteChange = (value: string) => {
    const next = { ...subjectNotes, [selectedSubjectKey]: value };
    setSubjectNotes(next);
    setNoteSaved(false);

    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(async () => {
      setNoteSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentMeta = user?.user_metadata || {};
        await supabase.auth.updateUser({
          data: {
            ...currentMeta,
            subject_notes: next
          }
        });
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2000);
      } catch (err) {
        console.error('Notlar kaydedilirken hata oluştu:', err);
      } finally {
        setNoteSaving(false);
      }
    }, 1000);
  };

  // Insert formatting helper
  const insertText = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = subjectNotes[selectedSubjectKey] || '';
    const newText = currentText.substring(0, start) + template + currentText.substring(end);
    
    handleNoteChange(newText);
    
    // Restore focus and cursor position after render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + template.length, start + template.length);
    }, 50);
  };

  // Copy to clipboard
  const handleCopyNote = async () => {
    const text = subjectNotes[selectedSubjectKey] || '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Clear note
  const handleClearNote = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset confirm
      return;
    }
    handleNoteChange('');
    setConfirmClear(false);
  };

  // ── Filters & Stats ───────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.text.toLowerCase().includes(taskSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (taskFilter === 'active') return !t.done;
      if (taskFilter === 'completed') return t.done;
      if (taskFilter === 'high') return t.priority === 'high';
      return true;
    });
  }, [tasks, taskSearch, taskFilter]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [tasks]);

  const activeSubjectInfo = useMemo(() => {
    const matched = subjectKeys.find(s => s.key === selectedSubjectKey);
    const metaId = matched ? matched.id : 'matematik';
    return {
      meta: subjectMeta[metaId],
      key: selectedSubjectKey,
      noteText: subjectNotes[selectedSubjectKey] || ''
    };
  }, [selectedSubjectKey, subjectNotes]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Ana Sayfa</span>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <span>📋</span> Çalışma Paneli
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono hidden md:inline-block bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border dark:border-zinc-800">
            👤 {userEmail}
          </span>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: TASK MANAGER (col-span-5) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Progress Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Haftalık Görevlerim</span>
              <h2 className="text-xl font-extrabold mt-1">İlerleme Durumu</h2>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${taskStats.percent}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                {taskStats.total} görevden {taskStats.done} tanesi tamamlandı.
              </p>
            </div>
            <div className="h-16 w-16 shrink-0 rounded-full border-4 border-blue-500/10 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10" />
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 z-10 font-mono">{taskStats.percent}%</span>
            </div>
          </div>

          {/* Task Manager Base Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span>📌</span> Görev Yöneticisi
              {saving && <span className="text-[10px] text-blue-500 animate-pulse ml-auto">Kaydediliyor...</span>}
            </h3>

            {/* Input fields to add task */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
              <input
                type="text"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Hangi konuyu çalışacaksın veya ne yapacaksın?"
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 mr-1 uppercase">Öncelik:</span>
                  {(['high', 'mid', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`px-3 py-1 text-[10px] font-black rounded-full border transition-all cursor-pointer ${
                        newTaskPriority === p ? priorityMeta[p].badge + ' opacity-100 scale-105' : 'opacity-40 ' + priorityMeta[p].badge
                      }`}
                    >
                      {priorityMeta[p].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskText.trim()}
                  className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white cursor-pointer active:scale-95 transition-all shadow-md shadow-blue-500/10"
                >
                  Görev Ekle
                </button>
              </div>
            </div>

            {/* Search and filtering options */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Görev ara..."
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              
              {/* Reset filter trigger */}
              {taskSearch && (
                <button onClick={() => setTaskSearch('')} className="text-[10px] text-red-500 font-bold hover:underline">Temizle</button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800/80 pb-2 gap-1 overflow-x-auto">
              {([
                { id: 'all', label: 'Tümü' },
                { id: 'active', label: 'Yapılacaklar' },
                { id: 'completed', label: 'Tamamlananlar' },
                { id: 'high', label: 'Acil' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTaskFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    taskFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks list scrolling block */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] pr-1">
              {filteredTasks.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center">
                  <span className="text-3xl mb-2">📋</span>
                  <p className="text-xs font-bold">Kriterlere uygun görev bulunamadı.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all group ${
                      task.done
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-800/50 opacity-60'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-800'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        task.done ? 'bg-blue-500 border-blue-500' : 'border-zinc-300 dark:border-zinc-650 hover:border-blue-500'
                      }`}
                    >
                      {task.done && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm break-words transition-all ${task.done ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100 font-bold'}`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${priorityMeta[task.priority].badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority].dot}`} />
                          {priorityMeta[task.priority].label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shrink-0"
                      title="Görevi Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: SUBJECT NOTES WORKSPACE (col-span-7) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Subject selector tabs (Clean slider with hidden scrollbar) */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-zinc-200 dark:border-zinc-800 pb-3">
            {subjectKeys.map(({ key, id }) => {
              const meta = subjectMeta[id];
              const isActive = selectedSubjectKey === key;
              const hasNote = !!(subjectNotes[key]?.trim());
              
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedSubjectKey(key);
                    setConfirmClear(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {hasNote && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Unified Premium Editor Workspace Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-md flex-1 flex flex-col min-h-[520px] overflow-hidden">
            
            {/* Editor Header Pane */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xl shadow-sm shrink-0">
                  {activeSubjectInfo.meta.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {activeSubjectInfo.meta.label} Notları
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Önemli hap bilgiler ve sınav tüyoları</p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-[11px] font-bold">
                {noteSaving ? (
                  <span className="text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Kaydediliyor...
                  </span>
                ) : noteSaved ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/30 animate-fadeIn">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Kaydedildi
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/30 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                    Senkronize
                  </span>
                )}
              </div>
            </div>

            {/* Editor Action Toolbar Pane */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/20 dark:bg-zinc-950/10 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => insertText('• ')}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
                  title="Madde İşareti Ekle"
                >
                  • Liste
                </button>
                <button
                  onClick={() => insertText('[Hap Bilgi]: ')}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
                  title="Hap Bilgi İşareti"
                >
                  💡 Hap Bilgi
                </button>
                <button
                  onClick={() => insertText('**kalın**')}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer font-bold shadow-sm"
                  title="Kalın Yaz"
                >
                  B
                </button>
                <button
                  onClick={() => insertText('__altı çizili__')}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer underline shadow-sm"
                  title="Altı Çizili Yaz"
                >
                  U
                </button>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={handleCopyNote}
                  disabled={!activeSubjectInfo.noteText.trim()}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-40'
                  }`}
                  title="Tüm notu kopyala"
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2050/svg" className="w-3.5 h-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2050/svg" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                      </svg>
                      Kopyala
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearNote}
                  disabled={!activeSubjectInfo.noteText.trim()}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm ${
                    confirmClear
                      ? 'bg-red-500 border-red-500 text-white animate-pulse'
                      : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:text-red-500'
                  }`}
                  title="Tüm notu temizle"
                >
                  {confirmClear ? 'Emin misiniz?' : 'Temizle'}
                </button>
              </div>
            </div>

            {/* Note Editor text area block */}
            <div className="flex-1 flex flex-col relative bg-zinc-50/10 dark:bg-zinc-950/20">
              <textarea
                ref={textareaRef}
                value={activeSubjectInfo.noteText}
                onChange={e => handleNoteChange(e.target.value)}
                placeholder={`${activeSubjectInfo.meta.label} dersine dair aldığın notlar burada toplanır. Yukarıdaki tuşlarla biçimlendirebilir veya kendi eklemelerini yapabilirsin. Yazmaya başladığında otomatik kaydedilir.`}
                className="w-full flex-1 p-5 bg-transparent outline-none resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 leading-relaxed font-sans min-h-[300px]"
              />
              
              {/* Note character and lines count footer */}
              <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-bold font-mono">
                <span>
                  Karakter: {activeSubjectInfo.noteText.length}
                </span>
                <span>
                  Satır: {activeSubjectInfo.noteText.split('\n').filter(Boolean).length}
                </span>
              </div>
            </div>
            
          </div>
        </section>

      </main>
    </div>
  );
}
