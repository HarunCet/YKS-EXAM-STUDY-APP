'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface SprintQuestion {
  text: string;
  answer: number;
  tip?: string;
}

export default function SpeedSprintPage() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SprintQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [highscore, setHighscore] = useState(0);
  const [savingHighscore, setSavingHighscore] = useState(false);
  const [showTip, setShowTip] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [supabase, router]);

  // Load highscore on mount
  useEffect(() => {
    async function loadHighscore() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const stats = user.user_metadata?.exercise_stats || {};
          setHighscore(stats.sprintHighscore || 0);
        }
      } catch (e) {
        // Fallback to localStorage
        const cached = localStorage.getItem('sprint_highscore');
        if (cached) setHighscore(parseInt(cached, 10));
      }
    }
    loadHighscore();
  }, [supabase]);

  // Handle focus
  useEffect(() => {
    if (gameState === 'running' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentQuestion]);

  // Question generator
  const generateQuestion = (time: number): SprintQuestion => {
    // Determine level based on time left
    // time goes from 60 down to 0
    if (time > 45) {
      // Stage 1: Basic additions/subtractions (45 to 60)
      const num1 = Math.floor(Math.random() * 80) + 11;
      const num2 = Math.floor(Math.random() * 80) + 11;
      const isAdd = Math.random() > 0.5;
      return {
        text: isAdd ? `${num1} + ${num2} = ?` : `${num1} - ${num2} = ?`,
        answer: isAdd ? num1 + num2 : num1 - num2,
        tip: 'Öneri: Onlukları ve birlikleri ayrı toplayıp birleştirin.'
      };
    } else if (time > 30) {
      // Stage 2: Basic multiplications/divisions (30 to 45)
      const isMult = Math.random() > 0.5;
      if (isMult) {
        const num1 = Math.floor(Math.random() * 12) + 3; // 3-14
        const num2 = Math.floor(Math.random() * 12) + 3; // 3-14
        return {
          text: `${num1} × ${num2} = ?`,
          answer: num1 * num2,
          tip: 'Öneri: Çarpma işlemlerini basitleştirmek için 10 ile çarpıp çıkartın veya ekleyin.'
        };
      } else {
        const num2 = Math.floor(Math.random() * 9) + 3; // 3-11
        const answer = Math.floor(Math.random() * 12) + 3; // 3-14
        return {
          text: `${answer * num2} ÷ ${num2} = ?`,
          answer: answer,
          tip: 'Öneri: Bölme, çarpma işleminin tersidir. Hangi sayıyı çarparsam bunu elde ederim diye düşünün.'
        };
      }
    } else if (time > 15) {
      // Stage 3: Squares & roots (15 to 30)
      const isSquare = Math.random() > 0.5;
      if (isSquare) {
        const base = Math.floor(Math.random() * 11) + 5; // 5-15
        return {
          text: `${base}² = ?`,
          answer: base * base,
          tip: 'Öneri: TYT için 1\'den 20\'ye kadar sayıların karelerini ezbere bilmek hız kazandırır!'
        };
      } else {
        const squares = [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225];
        const root = squares[Math.floor(Math.random() * squares.length)];
        const addition = Math.floor(Math.random() * 20) + 1;
        const answer = Math.sqrt(root) + addition;
        return {
          text: `√${root} + ${addition} = ?`,
          answer: answer,
          tip: 'Öneri: Önce köklü ifadenin değerini bulun, sonra ekleyin.'
        };
      }
    } else {
      // Stage 4: Basic algebra & equations (0 to 15)
      const xVal = Math.floor(Math.random() * 9) + 2; // 2-10
      const coeff = Math.floor(Math.random() * 7) + 2; // 2-8
      const constant = Math.floor(Math.random() * 20) + 1; // 1-20
      const isAdd = Math.random() > 0.5;
      const rhs = isAdd ? (coeff * xVal) + constant : (coeff * xVal) - constant;
      
      return {
        text: `${coeff}x ${isAdd ? '+' : '-'} ${constant} = ${rhs} ise x kaçtır?`,
        answer: xVal,
        tip: 'Öneri: Sabit sayıyı karşıya atın ve katsayıya bölün.'
      };
    }
  };

  const startSprint = () => {
    setScore(0);
    setWrong(0);
    setTimeLeft(60);
    setUserAnswer('');
    setFeedback(null);
    setShowTip(false);
    const firstQ = generateQuestion(60);
    setCurrentQuestion(firstQ);
    setGameState('running');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishGame = async () => {
    setGameState('finished');
    
    // Check for highscore update
    const finalScore = score;
    const isNewRecord = finalScore > highscore;
    
    if (isNewRecord) {
      setHighscore(finalScore);
      localStorage.setItem('sprint_highscore', String(finalScore));
      
      // Update Supabase
      setSavingHighscore(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const currentMeta = user.user_metadata || {};
          const currentStats = currentMeta.exercise_stats || {};
          
          await supabase.auth.updateUser({
            data: {
              ...currentMeta,
              exercise_stats: {
                ...currentStats,
                sprintHighscore: finalScore
              }
            }
          });
        }
      } catch (err) {
        console.error('Highscore could not be saved to Supabase:', err);
      } finally {
        setSavingHighscore(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'running' || !currentQuestion) return;

    const parsed = parseInt(userAnswer.trim(), 10);
    
    if (parsed === currentQuestion.answer) {
      setScore((s) => s + 1);
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 300);
      setUserAnswer('');
      // Generate next question with the current time
      setCurrentQuestion(generateQuestion(timeLeft));
    } else {
      setWrong((w) => w + 1);
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 400);
      // Give a tiny penalty or just skip to next
      setUserAnswer('');
      setCurrentQuestion(generateQuestion(timeLeft));
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2 dark:text-white">
          <span>⚡</span> Pratik İşlem Sprinti
        </h1>
        <Link
          href="/exercises"
          className="text-sm px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 dark:text-zinc-100"
        >
          Egzersiz Merkezine Dön
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {gameState === 'idle' && (
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800 text-center space-y-6 animate-fadeIn">
            <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mx-auto">
              ⚡
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black dark:text-white">Zamana Karşı İşlem Hızı</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                60 saniye içinde karşınıza çıkan pratik matematik işlemlerini doğru çözmeye çalışın. Süre azaldıkça soruların zorluk seviyesi ve türü (Toplama, Çarpma, Karekök, Denklem) değişecektir!
              </p>
            </div>

            {/* Highscore display */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border dark:border-zinc-800">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 block uppercase font-bold tracking-wider">En Yüksek Skorun</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">{highscore} puan</span>
            </div>

            <button
              onClick={startSprint}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              Yarışı Başlat! (60 Sn)
            </button>
          </div>
        )}

        {gameState === 'running' && currentQuestion && (
          <div className={`w-full max-w-xl bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800 text-center space-y-6 transition-all duration-200 ${
            feedback === 'correct' ? 'ring-4 ring-green-500/20 bg-green-50/10 border-green-500' :
            feedback === 'incorrect' ? 'ring-4 ring-red-500/20 bg-red-50/10 border-red-500 animate-shake' : ''
          }`}>
            {/* Header info: timer & scores */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 px-3 py-1.5 rounded-xl text-amber-600 dark:text-amber-450 font-bold font-mono">
                ⏱️ {timeLeft} sn
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">Doğru: {score}</span>
                <span className="text-sm font-bold text-red-500 dark:text-red-400">Yanlış: {wrong}</span>
              </div>
            </div>

            {/* Progress line */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="py-10 space-y-2">
              <div className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                {timeLeft > 45 ? 'Kademe 1: Toplama ve Çıkarma' :
                 timeLeft > 30 ? 'Kademe 2: Çarpma ve Bölme' :
                 timeLeft > 15 ? 'Kademe 3: Kareler ve Karekökler' :
                 'Kademe 4: Denklem Çözme'}
              </div>
              <h2 className="text-4xl font-black font-mono tracking-wide dark:text-white pt-2">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer Input */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                ref={inputRef}
                type="text"
                pattern="-?[0-9]*"
                inputMode="numeric"
                placeholder="Cevabınızı yazıp Enter'a basın..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700 font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                autoComplete="off"
                required
              />

              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowTip(!showTip)}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showTip ? '💡 İpucunu Gizle' : '💡 Hızlı Çözüm İpucu İster misin?'}
                </button>
              </div>

              {showTip && currentQuestion.tip && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-left text-xs leading-relaxed animate-fadeIn">
                  {currentQuestion.tip}
                </div>
              )}
            </form>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800 text-center space-y-6 animate-fadeIn">
            <div className="text-5xl">🏆</div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black dark:text-white">Antrenman Tamamlandı!</h2>
              <p className="text-zinc-400 dark:text-zinc-500 text-xs">Süren bitti, sonuçlar kaydedildi.</p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50/30 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20 rounded-2xl">
                <span className="text-[10px] text-green-700 dark:text-green-400 font-black uppercase tracking-wider block">Doğru Cevap</span>
                <span className="text-3xl font-black text-green-600 dark:text-green-400 font-mono mt-1 block">{score}</span>
              </div>
              <div className="p-4 bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                <span className="text-[10px] text-red-700 dark:text-red-400 font-black uppercase tracking-wider block">Yanlış Cevap</span>
                <span className="text-3xl font-black text-red-500 dark:text-red-400 font-mono mt-1 block">{wrong}</span>
              </div>
            </div>

            {/* Stats list */}
            <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border dark:border-zinc-800 text-sm font-medium">
              <div className="flex justify-between py-1 border-b dark:border-zinc-700">
                <span className="text-zinc-550 dark:text-zinc-400">Toplam Çözülen Soru:</span>
                <span className="font-bold dark:text-zinc-100">{score + wrong}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-zinc-700">
                <span className="text-zinc-555 dark:text-zinc-400">Doğruluk Oranı:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {score + wrong > 0 ? Math.round((score / (score + wrong)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-555 dark:text-zinc-400">En Yüksek Skorun:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{highscore}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startSprint}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
              >
                Tekrar Yarış ⚡
              </button>
              <Link
                href="/exercises"
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 font-bold rounded-xl text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 border dark:border-zinc-750 transition-colors text-center cursor-pointer"
              >
                Egzersizler
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
