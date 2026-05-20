'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import rawData from '@/data/konular.json';

type Konu = { sira: number; konu: string };
type KonuData = {
  tyt_konulari: Record<string, Konu[]>;
  ayt_konulari: Record<string, Konu[]>;
};

const konularData = rawData as KonuData;

const subjectMeta: Record<string, { icon: string; color: string; bg: string; darkBg: string; border: string }> = {
  matematik: { icon: '📐', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50', darkBg: 'dark:bg-blue-950/10', border: 'border-blue-100 dark:border-blue-950/30' },
  fizik: { icon: '⚛️', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50', darkBg: 'dark:bg-purple-950/10', border: 'border-purple-100 dark:border-purple-950/30' },
  kimya: { icon: '🧪', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50', darkBg: 'dark:bg-emerald-950/10', border: 'border-emerald-100 dark:border-emerald-950/30' },
  biyoloji: { icon: '🧬', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50', darkBg: 'dark:bg-rose-950/10', border: 'border-rose-100 dark:border-rose-950/30' },
  dil_bilgisi: { icon: '✍️', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50', darkBg: 'dark:bg-amber-950/10', border: 'border-amber-100 dark:border-amber-950/30' },
};

export default function KonularPage() {
  const [completed, setCompleted]       = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab]       = useState<'TYT' | 'AYT'>('TYT');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterType, setFilterType]     = useState<'all' | 'completed' | 'incomplete'>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>({});

  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const m = user.user_metadata || {};
        if (m.completed_topics)  setCompleted(m.completed_topics);
        if (m.subject_notes)     setSubjectNotes(m.subject_notes);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [supabase.auth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subjectParam = params.get('subject');
      if (subjectParam) {
        if (subjectParam.startsWith('ayt_')) {
          setActiveTab('AYT');
        } else if (subjectParam.startsWith('tyt_')) {
          setActiveTab('TYT');
        }
        setExpandedSubjects(prev => ({ ...prev, [subjectParam]: true }));
      }
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const activeData = activeTab === 'TYT' ? konularData.tyt_konulari : konularData.ayt_konulari;
      const firstKey = Object.keys(activeData)[0];
      if (firstKey) setExpandedSubjects({ [firstKey]: true });
    }
  }, [activeTab, loading]);

  const persistCompleted = async (newCompleted: Record<string, boolean>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentMeta = user?.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...currentMeta,
          completed_topics: newCompleted,
        },
      });
    } catch (err) {
      console.error('Konu kaydedilemedi:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleKonu = (subjectKey: string, konuId: number) => {
    const key = `${subjectKey}_${konuId}`;
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    persistCompleted(next);
  };

  const activeData = activeTab === 'TYT' ? konularData.tyt_konulari : konularData.ayt_konulari;

  const formatSubjectName = (key: string) => {
    const name = key.replace('tyt_', '').replace('ayt_', '').replace('_konulari', '').replace('_', ' ');
    if (name.toLowerCase() === 'dil bilgisi') return 'Türkçe Dil Bilgisi';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getSubjectMeta = (key: string) => {
    const name = key.replace('tyt_', '').replace('ayt_', '').replace('_konulari', '').toLowerCase();
    return subjectMeta[name] || { icon: '📚', color: 'text-zinc-600', bg: 'bg-zinc-50', darkBg: 'dark:bg-zinc-900', border: 'border-zinc-200' };
  };

  const toggleSubjectExpand = (key: string) =>
    setExpandedSubjects(prev => ({ ...prev, [key]: !prev[key] }));

  const stats = useMemo(() => {
    let total = 0, done = 0;
    Object.entries(activeData).forEach(([sk, topics]) => {
      topics.forEach(t => { total++; if (completed[`${sk}_${t.sira}`]) done++; });
    });
    return { total, completed: done, percent: Math.round((done / total) * 100) || 0 };
  }, [activeData, completed]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground font-sans select-none">

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
            <span>📚</span> Konu Takip
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-blue-500 animate-pulse font-medium">Değişiklikler kaydediliyor...</span>}
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex gap-1">
            {(['TYT', 'AYT'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 animate-fadeIn">

        {/* Summary Progress Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-650 dark:from-zinc-900 dark:to-zinc-850 p-6 rounded-3xl text-white shadow-sm border dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black mb-1">{activeTab} Çalışma İlerlemesi</h2>
            <p className="text-blue-100 dark:text-zinc-400 text-sm">
              Toplam {stats.total} müfredat konusunun {stats.completed} tanesini başarıyla tamamladın!
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-3xl font-black font-mono tracking-tight">{stats.percent}%</span>
              <span className="block text-[10px] text-blue-200 dark:text-zinc-400 font-bold uppercase tracking-wider">Tamamlandı</span>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-blue-550/30 dark:border-zinc-700 flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-white/20 dark:bg-blue-500/20 transition-all duration-700" style={{ height: `${stats.percent}%` }} />
              <span className="text-lg font-bold z-10">🚀</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Konu ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg xmlns="http://www.w3.org/2050/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto justify-start sm:justify-end">
            {([['all','Tümü'],['incomplete','Eksikler'],['completed','Tamamlananlar']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterType(val)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  filterType === val
                    ? val === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-105 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                      : val === 'incomplete'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                    : 'bg-transparent text-zinc-655 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Accordions */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-850 rounded-2xl w-full" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(activeData).map(([subjectKey, topics]) => {
              const total = topics.length;
              const completedCount = topics.filter(t => completed[`${subjectKey}_${t.sira}`]).length;
              const progress = Math.round((completedCount / total) * 100) || 0;
              const meta = getSubjectMeta(subjectKey);
              const isExpanded = !!expandedSubjects[subjectKey];

              const filteredTopics = topics.filter(t => {
                const isDone = !!completed[`${subjectKey}_${t.sira}`];
                const matchesSearch = t.konu.toLowerCase().includes(searchQuery.toLowerCase());
                if (filterType === 'completed') return isDone && matchesSearch;
                if (filterType === 'incomplete') return !isDone && matchesSearch;
                return matchesSearch;
              });

              if (searchQuery && filteredTopics.length === 0) return null;

              return (
                <div key={subjectKey} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-750">
                  <div
                    onClick={() => toggleSubjectExpand(subjectKey)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    role="button"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-850 shadow-sm">
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-extrabold text-base text-zinc-950 dark:text-zinc-100 truncate">
                            {formatSubjectName(subjectKey)}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {completedCount} / {total} Konu
                          </span>
                          {/* Subject note indicator links to the new Çalışma Paneli */}
                          {subjectNotes[subjectKey]?.trim() && (
                            <Link
                              href={`/calisma-paneli?subject=${subjectKey}`}
                              onClick={e => {
                                e.stopPropagation();
                              }}
                              title="Notları Gör ve Düzenle"
                              className="text-amber-500 hover:text-amber-600 transition-colors flex items-center shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                            </Link>
                          )}
                        </div>
                        <div className="w-full max-w-sm mt-2.5 flex items-center gap-3">
                          <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 w-8 text-right font-mono">{progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-850 p-4 bg-zinc-50/20 dark:bg-zinc-950/10">
                      {filteredTopics.length === 0 ? (
                        <div className="p-6 text-center text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                          Kriterlere uygun konu bulunamadı.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                          {filteredTopics.map(topic => {
                            const isDone = !!completed[`${subjectKey}_${topic.sira}`];
                            return (
                              <label
                                key={topic.sira}
                                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer group hover:shadow-sm ${
                                  isDone
                                    ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-850'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-205 dark:border-zinc-800/80 hover:border-blue-400 dark:hover:border-blue-800'
                                }`}
                              >
                                <div className="relative flex items-center justify-center mt-0.5">
                                  <input type="checkbox" checked={isDone} onChange={() => toggleKonu(subjectKey, topic.sira)} className="peer sr-only" />
                                  <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isDone ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-zinc-300 dark:border-zinc-650 group-hover:border-blue-500'}`}>
                                    {isDone && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-sm select-none transition-all ${isDone ? 'text-zinc-400 dark:text-zinc-550 line-through font-normal' : 'text-zinc-800 dark:text-zinc-200 font-bold'}`}>
                                  {topic.konu}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}