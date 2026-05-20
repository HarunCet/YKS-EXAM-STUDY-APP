'use client';

import { useState, useEffect, useRef } from 'react';
import rawData from '@/data/mathsproblems.json';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface MathProblem {
  questionNumber: number;
  question: string;
  answer: string;
  konu?: string;
  secenekler?: { [key: string]: string };
  dogru_cevap?: string;
  aciklama?: string;
}

const mathProblems = rawData as unknown as MathProblem[];
const QUESTIONS_PER_SET = 10;
const SET_DURATION = 11 * 60; // saniye

type QuestionState = {
  typedAnswer: string;
  selectedOption: string | null;
  checked: boolean;
  isCorrect: boolean;
};

export default function MathsExercisePage() {
  const [currentSet, setCurrentSet] = useState(0);
  const [currentIndexInSet, setCurrentIndexInSet] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(() =>
    Array(QUESTIONS_PER_SET).fill(null).map(() => ({
      typedAnswer: '',
      selectedOption: null,
      checked: false,
      isCorrect: false,
    }))
  );
  const [timeLeft, setTimeLeft] = useState(SET_DURATION);
  const [timeExpired, setTimeExpired] = useState(false);
  const [setFinished, setSetFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Time-tracking per question state
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [questionDurations, setQuestionDurations] = useState<number[]>(() => Array(QUESTIONS_PER_SET).fill(0));

  // Canvas Scratchpad state
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#3b82f6'); // default blue-500
  const [penWidth, setPenWidth] = useState(3);

  const supabase = createClient();

  const totalSets = Math.ceil(mathProblems.length / QUESTIONS_PER_SET);
  const setStart = currentSet * QUESTIONS_PER_SET;
  const setEnd = Math.min(setStart + QUESTIONS_PER_SET, mathProblems.length);

  // Start question timer when index changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndexInSet, currentSet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setParam = params.get('set');
    const indexParam = params.get('index');
    if (setParam) setCurrentSet(parseInt(setParam, 10));
    if (indexParam) setCurrentIndexInSet(parseInt(indexParam, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem('lastMathsQuestion', JSON.stringify({
      set: currentSet,
      index: currentIndexInSet,
      questionNumber: setStart + currentIndexInSet + 1,
      timestamp: Date.now()
    }));
  }, [currentSet, currentIndexInSet, setStart]);

  const setProblems = mathProblems.slice(setStart, setEnd);
  const problem = setProblems[currentIndexInSet];
  const isMultipleChoice = !!problem?.secenekler;
  const currentState = questionStates[currentIndexInSet];

  const answeredCount = questionStates.filter(s => s.checked).length;
  const correctCount = questionStates.filter(s => s.checked && s.isCorrect).length;

  // Timer
  useEffect(() => {
    if (setFinished || timeExpired) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimeExpired(true);
          handleFinishSet();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [currentSet, setFinished, timeExpired]);

  // Track drawing canvas resizing or setup
  useEffect(() => {
    if (scratchpadOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  }, [scratchpadOpen, currentIndexInSet]);

  const recordCurrentQuestionTime = () => {
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionDurations(prev => {
      const next = [...prev];
      next[currentIndexInSet] = (next[currentIndexInSet] || 0) + elapsed;
      return next;
    });
  };

  const handleFinishSet = async () => {
    recordCurrentQuestionTime();
    setSetFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save stats to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

        const finalTotal = setProblems.length;
        // Count final correctness of current state
        const finalCorrect = questionStates.filter(s => s.checked && s.isCorrect).length;

        const nextMathsSolved = (currentStats.mathsSolved || 0) + finalTotal;
        const oldTotal = currentStats.mathsSolved || 0;
        const oldAcc = currentStats.mathsAccuracy || 0;
        const totalCorrect = Math.round((oldTotal * oldAcc) / 100) + finalCorrect;
        const nextAccuracy = nextMathsSolved > 0 ? Math.round((totalCorrect / nextMathsSolved) * 100) : 0;

        await supabase.auth.updateUser({
          data: {
            ...currentMeta,
            exercise_stats: {
              ...currentStats,
              mathsSolved: nextMathsSolved,
              mathsAccuracy: nextAccuracy
            }
          }
        });
      }
    } catch (e) {
      console.error('Math stats could not be synced with Supabase:', e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerColor =
    timeLeft <= 60
      ? 'text-red-500 dark:text-red-400'
      : timeLeft <= 180
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  const timerPercent = (timeLeft / SET_DURATION) * 100;

  const progressBarColor =
    timeLeft <= 60
      ? 'bg-red-500'
      : timeLeft <= 180
        ? 'bg-amber-500'
        : 'bg-blue-500';

  const updateState = (patch: Partial<QuestionState>) => {
    setQuestionStates(prev => {
      const next = [...prev];
      next[currentIndexInSet] = { ...next[currentIndexInSet], ...patch };
      return next;
    });
  };

  const handleChoiceSelect = (key: string) => {
    if (currentState.checked || setFinished) return;
    const isCorrect = key === problem.dogru_cevap;
    updateState({ selectedOption: key, checked: true, isCorrect });
  };

  const handleCheckTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (setFinished) return;
    const normUser = currentState.typedAnswer.trim().replace(',', '.').toLowerCase();
    const normCorrect = problem.answer.trim().replace(',', '.').toLowerCase();
    updateState({ checked: true, isCorrect: normUser === normCorrect });
  };

  const handleNext = () => {
    recordCurrentQuestionTime();
    if (currentIndexInSet < setProblems.length - 1) {
      setCurrentIndexInSet(i => i + 1);
    } else {
      handleFinishSet();
    }
  };

  const handlePrev = () => {
    recordCurrentQuestionTime();
    if (currentIndexInSet > 0) setCurrentIndexInSet(i => i - 1);
  };

  const handleNextSet = () => {
    if (currentSet < totalSets - 1) {
      setCurrentSet(s => s + 1);
      setCurrentIndexInSet(0);
      setQuestionStates(
        Array(QUESTIONS_PER_SET).fill(null).map(() => ({
          typedAnswer: '',
          selectedOption: null,
          checked: false,
          isCorrect: false,
        }))
      );
      setQuestionDurations(Array(QUESTIONS_PER_SET).fill(0));
      setTimeLeft(SET_DURATION);
      setTimeExpired(false);
      setSetFinished(false);
    }
  };

  // ── DRAWING CANVAS (SCRATCHPAD) UTILS ───────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ── Set özeti ekranı ──────────────────────────────────────────────
  if (setFinished) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
        <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
          <h1 className="text-xl font-bold dark:text-white">Matematik Egzersizleri</h1>
          <Link
            href="/exercises"
            className="text-sm px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 dark:text-zinc-100 font-semibold"
          >
            Egzersiz Merkezine Dön
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="w-full bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow border dark:border-zinc-800 space-y-6">
            <div className="text-center">
              {timeExpired && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-red-700 dark:text-red-300 text-sm font-medium">
                  ⏱ Süre doldu!
                </div>
              )}
              <h2 className="text-2xl font-black dark:text-white mb-2">
                Set {currentSet + 1} Tamamlandı
              </h2>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm font-semibold">
                {setStart + 1}–{setEnd}. sorular
              </p>
            </div>

            {/* Skor kartları */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border dark:border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {answeredCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1 font-bold">Cevaplanan</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border dark:border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-600 dark:text-green-400">
                  {correctCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1 font-bold">Doğru</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border dark:border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-red-500 dark:text-red-400">
                  {answeredCount - correctCount}
                </div>
                <div className="text-xs text-zinc-500 mt-1 font-bold">Yanlış</div>
              </div>
            </div>

            {/* Soru Başına Süre Analiz Paneli */}
            <div className="border dark:border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold flex items-center gap-2 dark:text-white">
                <span>⏱️</span> Soru Başına Harcanan Süre Analizi
              </h3>
              
              <div className="space-y-3 pt-2">
                {setProblems.map((p, i) => {
                  const duration = questionDurations[i] || 0;
                  const isOverLimit = duration > 90; // YKS Limit 90s
                  // Percentage width for graph relative to max duration or 120s max
                  const percent = Math.min((duration / 120) * 100, 100);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-650 dark:text-zinc-400">Soru {i + 1} ({p.konu || 'Matematik'})</span>
                        <span className={`font-mono ${isOverLimit ? 'text-red-500 font-extrabold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {duration} sn {isOverLimit && '⚠️ (TYT Sınırını Aştın)'}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden flex items-center relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverLimit ? 'bg-red-500' : duration > 60 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold leading-relaxed pt-2">
                * TYT sınavında soru başına ortalama süre yaklaşık <b>90 saniyedir</b>. Kırmızı renkle işaretlenmiş sorular bu süreyi aştığınız alanları gösterir.
              </p>
            </div>

            {/* Soru özet listesi */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {setProblems.map((p, i) => {
                const s = questionStates[i];
                return (
                  <button
                    key={p.questionNumber}
                    onClick={() => {
                      setSetFinished(false);
                      setCurrentIndexInSet(i);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${!s.checked
                          ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400'
                          : s.isCorrect
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        }`}
                    >
                      {!s.checked ? i + 1 : s.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-1 flex-1">
                      {p.question}
                    </span>
                    {s.checked && !s.isCorrect && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0 font-mono">
                        Cevap: {p.answer}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSetFinished(false);
                  setCurrentIndexInSet(0);
                }}
                className="flex-1 px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-semibold text-sm cursor-pointer"
              >
                Soruları İncele
              </button>
              {currentSet < totalSets - 1 && (
                <button
                  onClick={handleNextSet}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-md cursor-pointer"
                >
                  Sonraki Set →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!problem) return null;

  // ── Ana soru ekranı ───────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold dark:text-white">Matematik Egzersizleri</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setScratchpadOpen(!scratchpadOpen)}
            className={`text-sm px-4 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
              scratchpadOpen 
                ? 'bg-blue-600 text-white border-blue-650' 
                : 'bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-100 dark:border-zinc-700'
            }`}
          >
            <span>🎨</span>
            <span>{scratchpadOpen ? 'Karalamayı Kapat' : 'Karalama Defteri'}</span>
          </button>
          <Link
            href="/exercises"
            className="text-sm px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 dark:text-zinc-100 font-semibold"
          >
            Egzersizler
          </Link>
        </div>
      </header>

      {/* Timer progress bar */}
      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-1000 ${progressBarColor}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="w-full space-y-4 relative">

          {/* Timer + Set bilgisi */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400">
                Set {currentSet + 1} / {totalSets}
              </span>
              <span className="text-zinc-300 dark:text-zinc-650">•</span>
              <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400">
                Sorular {setStart + 1}–{setEnd}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums ${timerColor}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Soru ilerleme pill'leri */}
          <div className="flex gap-1.5">
            {setProblems.map((_, i) => {
              const s = questionStates[i];
              return (
                <button
                  key={i}
                  onClick={() => {
                    recordCurrentQuestionTime();
                    setCurrentIndexInSet(i);
                  }}
                  title={`Soru ${i + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition-all ${i === currentIndexInSet
                      ? 'bg-blue-500'
                      : !s.checked
                        ? 'bg-zinc-200 dark:bg-zinc-700'
                        : s.isCorrect
                          ? 'bg-green-400 dark:bg-green-600'
                          : 'bg-red-400 dark:bg-red-650'
                    }`}
                />
              );
            })}
          </div>

          {/* Soru kartı */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border dark:border-zinc-800 overflow-hidden relative min-h-[300px] flex flex-col justify-between">
            
            {/* CANVAS SCRATCHPAD DRAWING CONTAINER */}
            {scratchpadOpen && (
              <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/80 z-30 flex flex-col justify-between animate-fadeIn">
                {/* Scratchpad toolbar */}
                <div className="p-2 border-b dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/40 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase mr-1">KALEM RENK:</span>
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#000000', '#ffffff'].map(c => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          penColor === c ? 'scale-115 ring-2 ring-blue-500' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearCanvas}
                      className="px-2.5 py-1 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[10px] font-bold rounded border dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      🗑️ TEMİZLE
                    </button>
                    <button
                      onClick={() => setScratchpadOpen(false)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                    >
                      KAPAT
                    </button>
                  </div>
                </div>

                {/* Canvas space */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="flex-1 w-full bg-transparent cursor-crosshair touch-none"
                />
                
                <div className="p-1 text-center bg-zinc-50 dark:bg-zinc-950/20 text-[9px] text-zinc-400 font-bold">
                  * Buraya karalayarak hesaplama yapabilirsiniz. Çözümü görmek için karalamayı kapatın.
                </div>
              </div>
            )}

            {/* Soru İçeriği */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Üst bilgi */}
              <div className="flex justify-between items-center pb-2 border-b dark:border-zinc-850">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border dark:border-blue-900/30">
                    Soru Konusu: {problem.konu || 'Problem Pratiği'}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-bold font-mono">
                  {currentIndexInSet + 1} / {setProblems.length}
                </span>
              </div>

              {/* Soru metni */}
              <p className="text-base leading-loose dark:text-zinc-100 font-medium">
                {problem.question}
              </p>

              {/* Çok seçmeli */}
              {isMultipleChoice && (
                <div className="grid gap-3 pt-4">
                  {Object.entries(problem.secenekler!).map(([key, val]) => {
                    const isCorrectChoice = key === problem.dogru_cevap;
                    const isSelected = key === currentState.selectedOption;
                    let cls =
                      'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all text-left w-full dark:border-zinc-700';
                    if (!currentState.checked) {
                      cls += ' hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-zinc-100';
                    } else if (isCorrectChoice) {
                      cls +=
                        ' bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-200 font-semibold';
                    } else if (isSelected) {
                      cls +=
                        ' bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-200 font-semibold';
                    } else {
                      cls += ' opacity-40 dark:text-zinc-450';
                    }
                    return (
                      <button key={key} onClick={() => handleChoiceSelect(key)} className={cls}>
                        <span className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold dark:text-zinc-100">
                          {key}
                        </span>
                        <span>{val}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Serbest cevap */}
              {!isMultipleChoice && (
                <div className="pt-4">
                  <form onSubmit={handleCheckTyped} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Cevabınızı girin (örnek: 216)"
                      value={currentState.typedAnswer}
                      onChange={e =>
                        updateState({ typedAnswer: e.target.value, checked: false, isCorrect: false })
                      }
                      disabled={currentState.checked || setFinished}
                      className="flex-1 rounded-xl border p-3.5 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 text-sm font-bold"
                      required
                    />
                    <button
                      type="submit"
                      disabled={currentState.checked || setFinished}
                      className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md cursor-pointer"
                    >
                      Cevabı Kontrol Et
                    </button>
                  </form>
                </div>
              )}

              {/* Sonuç */}
              {currentState.checked && (
                <div
                  className={`p-4 rounded-xl border transition-all ${currentState.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-950 dark:text-red-300'
                    }`}
                >
                  <p className="font-extrabold text-sm mb-1">
                    {currentState.isCorrect
                      ? '✓ Doğru Cevap!'
                      : `✗ Yanlış! Doğru cevap: ${problem.answer}`}
                  </p>
                  {problem.aciklama && (
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 mt-2 leading-relaxed">{problem.aciklama}</p>
                  )}
                </div>
              )}
            </div>

            {/* Navigasyon */}
            <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t dark:border-zinc-800">
              <button
                onClick={handlePrev}
                disabled={currentIndexInSet === 0}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-zinc-150 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                ← Önceki Soru
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {currentIndexInSet === setProblems.length - 1 ? 'Seti Bitir ✓' : 'Sonraki Soru →'}
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}