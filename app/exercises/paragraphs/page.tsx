'use client';

import { useState, useEffect, useRef } from 'react';
import paragraphData from '@/data/paragraphs.json';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const QUESTIONS_PER_SET = 5;

interface ParagraphItem {
  id: number;
  konu: string;
  paragraf: string;
  anahtar_kelimeler: string[];
}

export default function ParagraphsExercisePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReading, setIsReading] = useState(true);
  const [answers, setAnswers] = useState<string[]>(
    Array(paragraphData.length).fill('')
  );
  const [showResults, setShowResults] = useState(false);

  // Speed reading modes
  // 'normal' (standard reading timer) | 'guided' (word-by-word flashing speed reader)
  const [readMode, setReadMode] = useState<'normal' | 'guided'>('normal');
  const [selectedWpm, setSelectedWpm] = useState(250); // WPM speed
  const [timeLeft, setTimeLeft] = useState(60);

  // Guided reading state
  const [guidedWordIndex, setGuidedWordIndex] = useState(0);
  const [isGuidedPlaying, setIsGuidedPlaying] = useState(false);
  const guidedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = createClient();
  const item = paragraphData[currentIndex] as ParagraphItem;

  const words = item ? item.paragraf.split(/\s+/) : [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const indexParam = params.get('index');
    const showResultsParam = params.get('showResults');

    if (indexParam) setCurrentIndex(parseInt(indexParam, 10));
    if (showResultsParam === 'true') setShowResults(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('lastParagraphsQuestion', JSON.stringify({
      index: currentIndex,
      questionNumber: currentIndex + 1,
      showResults,
      timestamp: Date.now()
    }));
  }, [currentIndex, showResults]);

  // NORMAL TIMER
  useEffect(() => {
    if (!isReading || readMode !== 'normal') return;

    if (timeLeft <= 0) {
      setIsReading(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isReading, readMode]);

  // GUIDED TIMER (Tachistoscope)
  useEffect(() => {
    if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);

    if (isReading && readMode === 'guided' && isGuidedPlaying) {
      const intervalMs = (60 / selectedWpm) * 1000;
      guidedTimerRef.current = setInterval(() => {
        setGuidedWordIndex((prev) => {
          if (prev >= words.length - 1) {
            clearInterval(guidedTimerRef.current!);
            setIsGuidedPlaying(false);
            // Finished reading
            setTimeout(() => {
              setIsReading(false);
            }, 300);
            return words.length - 1;
          }
          return prev + 1;
        });
      }, intervalMs);
    }

    return () => {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
    };
  }, [isReading, readMode, isGuidedPlaying, selectedWpm, words.length]);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    // 5 soru bittiğinde sonuç ekranı
    if (nextIndex % QUESTIONS_PER_SET === 0) {
      handleFinishSet();
      return;
    }

    if (nextIndex < paragraphData.length) {
      setCurrentIndex(nextIndex);
      resetForNewParagraph();
    }
  };

  const resetForNewParagraph = () => {
    setTimeLeft(60);
    setGuidedWordIndex(0);
    setIsGuidedPlaying(false);
    setIsReading(true);
  };

  const handleContinue = () => {
    setShowResults(false);

    if (currentIndex + 1 < paragraphData.length) {
      setCurrentIndex(currentIndex + 1);
      resetForNewParagraph();
    }
  };

  const handleFinishSet = async () => {
    setShowResults(true);

    // Save stats to Supabase / LocalStorage
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalTotal = QUESTIONS_PER_SET;
      const newWpm = readMode === 'guided' ? selectedWpm : 250; // default estimated

      if (user) {
        const currentMeta = user.user_metadata || {};
        const currentStats = currentMeta.exercise_stats || {
          mathsSolved: 0,
          mathsAccuracy: 0,
          paragraphsRead: 0,
          paragraphsAvgWpm: 0,
          sprintHighscore: 0,
          flashcardsStudied: 0
        };

        const nextParagraphsRead = (currentStats.paragraphsRead || 0) + finalTotal;
        const oldTotal = currentStats.paragraphsRead || 0;
        const oldWpm = currentStats.paragraphsAvgWpm || 0;
        const nextAvgWpm = nextParagraphsRead > 0 ? Math.round(((oldTotal * oldWpm) + (finalTotal * newWpm)) / nextParagraphsRead) : 0;

        await supabase.auth.updateUser({
          data: {
            ...currentMeta,
            exercise_stats: {
              ...currentStats,
              paragraphsRead: nextParagraphsRead,
              paragraphsAvgWpm: nextAvgWpm
            }
          }
        });
      } else {
        // Fallback for guest in localStorage
        const localStatsRaw = localStorage.getItem('guest_exercise_stats');
        const currentStats = localStatsRaw ? JSON.parse(localStatsRaw) : {
          mathsSolved: 0,
          mathsAccuracy: 0,
          paragraphsRead: 0,
          paragraphsAvgWpm: 0,
          sprintHighscore: 0,
          flashcardsStudied: 0
        };

        const nextParagraphsRead = (currentStats.paragraphsRead || 0) + finalTotal;
        const oldTotal = currentStats.paragraphsRead || 0;
        const oldWpm = currentStats.paragraphsAvgWpm || 0;
        const nextAvgWpm = nextParagraphsRead > 0 ? Math.round(((oldTotal * oldWpm) + (finalTotal * newWpm)) / nextParagraphsRead) : 0;

        const nextStats = {
          ...currentStats,
          paragraphsRead: nextParagraphsRead,
          paragraphsAvgWpm: nextAvgWpm
        };
        localStorage.setItem('guest_exercise_stats', JSON.stringify(nextStats));
      }
    } catch (e) {
      console.error('Paragraph stats could not be saved:', e);
    }
  };

  const currentSetStart =
    Math.floor(currentIndex / QUESTIONS_PER_SET) *
    QUESTIONS_PER_SET;

  const currentSetEnd = currentSetStart + QUESTIONS_PER_SET;

  // KEYWORD MATCHING ENGINE
  const calculateRecallScore = (userText: string, keywords: string[]) => {
    if (!userText.trim()) return { score: 0, matched: [], missed: keywords };
    
    const textNorm = userText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
    
    const matched = keywords.filter(kw => {
      const kwNorm = kw.toLowerCase().trim();
      // Check if keyword is present
      return textNorm.includes(kwNorm);
    });

    const missed = keywords.filter(kw => !matched.includes(kw));
    const score = Math.round((matched.length / keywords.length) * 100);

    return { score, matched, missed };
  };

  // RESULT SCREEN
  if (showResults) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8 text-foreground">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-black dark:text-white flex items-center gap-2">
              <span>📊</span> Set Değerlendirme Raporu
            </h1>
            <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 font-bold px-3 py-1.5 rounded-full border dark:border-zinc-700">
              Sorular {currentSetStart + 1} - {currentSetEnd}
            </span>
          </div>

          <div className="space-y-6">
            {paragraphData
              .slice(currentSetStart, currentSetEnd)
              .map((paragraph, idx) => {
                const realIndex = currentSetStart + idx;
                const userText = answers[realIndex] || '';
                const { score, matched, missed } = calculateRecallScore(userText, paragraph.anahtar_kelimeler);

                return (
                  <div
                    key={realIndex}
                    className="grid md:grid-cols-2 gap-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-850 shadow-sm"
                  >
                    {/* Left pane: User summary and keyword breakdown */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>✍️</span> Hatırladıkların (Soru {realIndex + 1})
                        </h2>
                        
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                          score >= 70 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30' :
                          score >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                        }`}>
                          Hatırlama Skoru: %{score}
                        </span>
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/45 rounded-xl border dark:border-zinc-800/80 min-h-[120px] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans">
                        {userText || 'Cevap girilmedi.'}
                      </div>

                      {/* Keywords match breakdown */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Anahtar Kelimeler Analizi</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {matched.map(kw => (
                            <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30 text-green-750 dark:text-green-400 text-[10px] font-bold">
                              ✓ {kw}
                            </span>
                          ))}
                          {missed.map(kw => (
                            <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold opacity-60">
                              ✗ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right pane: Original Paragraph */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>📖</span> Orijinal Paragraf
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold">
                          {paragraph.konu}
                        </span>
                      </div>

                      <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-loose p-4 bg-zinc-50/50 dark:bg-zinc-950/25 rounded-xl border dark:border-zinc-800/60">
                        {paragraph.paragraf}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            {currentIndex + 1 < paragraphData.length && (
              <button
                onClick={handleContinue}
                className="px-6 py-3.5 rounded-xl bg-green-650 hover:bg-green-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Sonraki 5 Paragrafa Geç →
              </button>
            )}

            <Link
              href="/exercises"
              className="px-6 py-3.5 rounded-xl bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-350 dark:hover:bg-zinc-700 font-bold text-sm text-center transition-all cursor-pointer"
            >
              Egzersiz Merkezine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <span>📖</span> Hız Okuma & Paragraf Egzersizi
        </h1>

        <Link
          href="/exercises"
          className="text-sm px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 dark:text-zinc-100 font-semibold"
        >
          Egzersizler
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border dark:border-zinc-800 shadow-sm space-y-6">
          
          {/* Header Progress */}
          <div className="flex justify-between items-center pb-2 border-b dark:border-zinc-855">
            <span className="font-extrabold text-xs text-zinc-500">
              Soru {currentIndex + 1} ({item.konu})
            </span>

            {isReading && readMode === 'normal' && (
              <span className="text-red-500 font-mono font-bold text-sm flex items-center gap-1">
                ⏱️ {timeLeft} sn
              </span>
            )}
          </div>

          {isReading ? (
            <div className="space-y-6">
              
              {/* Reading mode selection */}
              <div className="flex bg-zinc-50 dark:bg-zinc-950/40 p-1.5 rounded-xl border dark:border-zinc-800 gap-1 select-none">
                <button
                  onClick={() => {
                    setReadMode('normal');
                    setIsGuidedPlaying(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    readMode === 'normal'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  ⏱️ Serbest Okuma (Zaman Sayaçlı)
                </button>
                <button
                  onClick={() => {
                    setReadMode('guided');
                    setTimeLeft(60);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    readMode === 'guided'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  ⚡ Göz Odaklı Hızlı Okuma
                </button>
              </div>

              {/* Mode 1: Normal Reading */}
              {readMode === 'normal' && (
                <div className="space-y-6">
                  <p className="leading-loose text-lg font-medium text-zinc-800 dark:text-zinc-100 text-justify">
                    {item.paragraf}
                  </p>

                  <button
                    onClick={() => setIsReading(false)}
                    className="w-full py-4 bg-green-650 hover:bg-green-700 text-white font-black rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                  >
                    Okumayı Tamamladım, Yazmaya Geç ✓
                  </button>
                </div>
              )}

              {/* Mode 2: Guided Speed Reading (Tachistoscope / Spritz-style) */}
              {readMode === 'guided' && (
                <div className="space-y-6 text-center">
                  
                  {/* Speed Selector */}
                  <div className="flex items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950/10 py-3 rounded-2xl border dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-extrabold uppercase">OKUMA HIZI:</span>
                    <div className="flex gap-1">
                      {[150, 200, 250, 300, 400].map(wpm => (
                        <button
                          key={wpm}
                          disabled={isGuidedPlaying}
                          onClick={() => setSelectedWpm(wpm)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border ${
                            selectedWpm === wpm
                              ? 'bg-green-600 border-green-600 text-white scale-105'
                              : 'bg-white border-zinc-200 dark:bg-zinc-850 dark:border-zinc-800 text-zinc-550 dark:text-zinc-450 disabled:opacity-50'
                          }`}
                        >
                          {wpm} WPM
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flash word box */}
                  <div className="h-44 w-full bg-zinc-50 dark:bg-zinc-950/60 rounded-3xl border-2 border-dashed dark:border-zinc-800 flex flex-col items-center justify-center relative px-6 shadow-inner">
                    
                    {/* Focus pointer */}
                    <div className="absolute top-2 w-px h-3 bg-green-650" />
                    <div className="absolute bottom-2 w-px h-3 bg-green-650" />

                    <div className="text-3xl font-black font-mono tracking-wide dark:text-white">
                      {words[guidedWordIndex] || 'Hazır'}
                    </div>

                    <div className="absolute bottom-3 right-5 text-[10px] text-zinc-450 font-bold font-mono">
                      Kelime: {guidedWordIndex + 1} / {words.length}
                    </div>
                  </div>

                  {/* Speed Reader controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsGuidedPlaying(!isGuidedPlaying)}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer ${
                        isGuidedPlaying 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-green-650 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isGuidedPlaying ? '⏸ Duraklat' : guidedWordIndex === 0 ? '▶ Oynatmayı Başlat' : '▶ Devam Et'}
                    </button>
                    <button
                      onClick={() => {
                        setIsGuidedPlaying(false);
                        setGuidedWordIndex(0);
                      }}
                      disabled={guidedWordIndex === 0}
                      className="px-5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border dark:border-zinc-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      🔄 Sıfırla
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold dark:text-zinc-150 flex items-center gap-1.5">
                <span>✍️</span> Hatırladıklarınızı Yazın
              </h2>

              <p className="text-xs text-zinc-450 dark:text-zinc-500 leading-relaxed font-semibold">
                Paragraftan aklınızda kalan tüm kilit bilgileri, kavramları ve olayları yazın. Sistem, girdiğiniz metni paragraftaki kilit kelimelerle kıyaslayarak bir <b>Hatırlama Skoru</b> hesaplayacaktır.
              </p>

              <textarea
                value={answers[currentIndex]}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[currentIndex] = e.target.value;
                  setAnswers(updated);
                }}
                className="w-full h-64 p-4 rounded-2xl border dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm font-medium leading-relaxed font-sans placeholder-zinc-400 dark:placeholder-zinc-650"
                placeholder="Örneğin: Yapay zeka ve makine öğrenimi sağlık alanında derin öğrenme modelleri ile kanser teşhisinde..."
              />

              <button
                onClick={handleNext}
                disabled={!answers[currentIndex].trim()}
                className="w-full py-4 bg-green-650 hover:bg-green-700 text-white font-black rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {currentIndex === paragraphData.length - 1 || (currentIndex + 1) % QUESTIONS_PER_SET === 0 
                  ? 'Seti Bitir ve Analizleri Gör ✓' 
                  : 'Sonraki Paragrafa Geç →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}