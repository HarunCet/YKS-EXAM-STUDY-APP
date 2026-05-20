'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import rawQuestions from '@/data/fen_yarisma.json';

interface Question {
  id: number;
  ders: string;
  konu: string;
  soru: string;
  secenekler: {
    A: string;
    B: string;
    C: string;
    D: string;
    [key: string]: string;
  };
  dogru_cevap: string;
  hap_bilgi: string;
}

interface YarismaClientProps {
  userEmail: string;
  userMetadata: any;
}

const questionsData = rawQuestions as Question[];

// Retro sound generator helper using Web Audio API
const playSound = (type: 'start' | 'select' | 'correct' | 'wrong' | 'victory', isMuted: boolean) => {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    switch (type) {
      case 'start': {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }
      case 'select': {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'correct': {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case 'wrong': {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'victory': {
        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.25);
        });
        break;
      }
    }
  } catch (e) {
    console.error('Audio context error:', e);
  }
};

export default function YarismaClient({ userEmail, userMetadata }: YarismaClientProps) {
  const supabase = createClient();
  const userNamePrefix = userEmail.split('@')[0];

  // System settings
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'round_result' | 'match_result'>('setup');
  const [mode, setMode] = useState<'local' | 'bot'>('bot');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState<'fen' | 'turkce'>('fen');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'Fizik' | 'Kimya' | 'Biyoloji' | 'Dil Bilgisi'>('all');
  const [isMuted, setIsMuted] = useState(false);

  // Player Names
  const [p1Name, setP1Name] = useState(userNamePrefix);
  const [p2Name, setP2Name] = useState('YKS Botu');

  // Match questions and indices
  const [matchQuestions, setMatchQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Sub-second timer (updates every 100ms)
  const [timeLeft, setTimeLeft] = useState(15.0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Round specific states
  const [p1Answer, setP1Answer] = useState<string | null>(null);
  const [p2Answer, setP2Answer] = useState<string | null>(null);
  const [p1AnswerTime, setP1AnswerTime] = useState<number | null>(null); // seconds left when answered
  const [p2AnswerTime, setP2AnswerTime] = useState<number | null>(null);

  // Match cumulative stats
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Corrects, setP1Corrects] = useState(0);
  const [p2Corrects, setP2Corrects] = useState(0);
  const [p1AnswersList, setP1AnswersList] = useState<(string | null)[]>([]);
  const [p2AnswersList, setP2AnswersList] = useState<(string | null)[]>([]);

  // Bot intelligence logic
  const botTargetTimeRef = useRef<number | null>(null);
  const botTargetAnswerRef = useRef<string | null>(null);

  // Study notes integration status
  const [noteSaveStatus, setNoteSaveStatus] = useState<Record<number, 'idle' | 'saving' | 'saved'>>({});
  const [savingAllNotes, setSavingAllNotes] = useState(false);

  // Keyboard listener
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Player 1 Keys: A, S, D, F -> A, B, C, D
      if (p1Answer === null) {
        if (key === 'a') submitAnswer(1, 'A');
        if (key === 's') submitAnswer(1, 'B');
        if (key === 'd') submitAnswer(1, 'C');
        if (key === 'f') submitAnswer(1, 'D');
      }

      // Player 2 Keys: H, J, K, L -> A, B, C, D (Only in local 1v1 mode)
      if (mode === 'local' && p2Answer === null) {
        if (key === 'h') submitAnswer(2, 'A');
        if (key === 'j') submitAnswer(2, 'B');
        if (key === 'k') submitAnswer(2, 'C');
        if (key === 'l') submitAnswer(2, 'D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, p1Answer, p2Answer, mode, timeLeft]);

  // Auto-reveal when both players have answered
  useEffect(() => {
    if (gameState === 'playing' && p1Answer !== null && p2Answer !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => {
        revealRoundResults(p1Answer, p2Answer, p1AnswerTime || 0, p2AnswerTime || 0);
      }, 1000);
    }
  }, [p1Answer, p2Answer, gameState, p1AnswerTime, p2AnswerTime]);

  // Game Loop Timer (100ms interval for fluid animations)
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));

        // Handle Bot decision trigger
        if (mode === 'bot' && p2Answer === null && botTargetTimeRef.current !== null) {
          if (nextTime <= botTargetTimeRef.current) {
            submitAnswer(2, botTargetAnswerRef.current || 'A', nextTime);
          }
        }

        if (nextTime <= 0) {
          clearInterval(timerRef.current!);
          // Auto reveal when time runs out
          revealRoundResults();
          return 0;
        }
        return nextTime;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode, p2Answer]);

  // Initialize a question round
  const startRound = (index: number, questionsList = matchQuestions) => {
    const currentQuestion = questionsList[index];
    if (!currentQuestion) return;

    setP1Answer(null);
    setP2Answer(null);
    setP1AnswerTime(null);
    setP2AnswerTime(null);
    setTimeLeft(15.0);
    setGameState('playing');

    // Pre-calculate bot response if in bot mode
    if (mode === 'bot') {
      const correctAns = currentQuestion.dogru_cevap;
      const options = ['A', 'B', 'C', 'D'];

      // Calculate delay based on difficulty
      let thinkDelay = 4.0; // default
      let isCorrect = Math.random() < 0.7; // default

      if (botDifficulty === 'easy') {
        thinkDelay = 5.0 + Math.random() * 6.0; // 5s to 11s delay
        isCorrect = Math.random() < 0.40; // 40% correct, 60% wrong
      } else if (botDifficulty === 'medium') {
        thinkDelay = 3.0 + Math.random() * 5.0; // 3s to 8s delay
        isCorrect = Math.random() < 0.75; // 75% correct, 25% wrong
      } else if (botDifficulty === 'hard') {
        thinkDelay = 1.0 + Math.random() * 3.5; // 1s to 4.5s delay
        isCorrect = Math.random() < 0.90; // 90% correct, 10% wrong
      }

      // Set target properties
      const targetRemainingTime = parseFloat((15.0 - thinkDelay).toFixed(1));
      botTargetTimeRef.current = targetRemainingTime > 0 ? targetRemainingTime : 0.5;

      if (isCorrect) {
        botTargetAnswerRef.current = correctAns;
      } else {
        const wrongOptions = options.filter(o => o !== correctAns);
        botTargetAnswerRef.current = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      }
    } else {
      botTargetTimeRef.current = null;
      botTargetAnswerRef.current = null;
    }
  };

  // Submit Answer
  const submitAnswer = (playerNum: 1 | 2, choice: string, customTime?: number) => {
    playSound('select', isMuted);
    const finalTime = customTime !== undefined ? customTime : timeLeft;

    if (playerNum === 1) {
      setP1Answer(choice);
      setP1AnswerTime(finalTime);
    } else {
      setP2Answer(choice);
      setP2AnswerTime(finalTime);
    }
  };

  // Transition to showing results for the round
  const revealRoundResults = (
    ans1 = p1Answer,
    ans2 = p2Answer,
    time1 = p1AnswerTime,
    time2 = p2AnswerTime
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = matchQuestions[currentQIndex];
    const correctOption = currentQuestion.dogru_cevap;

    let p1Correct = ans1 === correctOption;
    let p2Correct = ans2 === correctOption;

    let p1RoundScore = 0;
    let p2RoundScore = 0;

    // Scoring formula: 100 Base + Speed Bonus (Max 75, directly proportional to timeLeft)
    if (p1Correct && ans1) {
      const bonus = Math.round((time1 || 0) * 5);
      p1RoundScore = 100 + bonus;
      setP1Score(prev => prev + p1RoundScore);
      setP1Corrects(prev => prev + 1);
    }
    if (p2Correct && ans2) {
      const bonus = Math.round((time2 || 0) * 5);
      p2RoundScore = 100 + bonus;
      setP2Score(prev => prev + p2RoundScore);
      setP2Corrects(prev => prev + 1);
    }

    // Play round completion sound
    const isP1User = true; // Player 1 is always the user
    if (p1Correct) {
      playSound('correct', isMuted);
    } else {
      playSound('wrong', isMuted);
    }

    // Append history
    setP1AnswersList(prev => [...prev, ans1]);
    setP2AnswersList(prev => [...prev, ans2]);

    setGameState('round_result');
  };

  // Next round or end match
  const handleNextRound = () => {
    if (currentQIndex < 9) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      startRound(nextIdx);
    } else {
      // Game ended
      playSound('victory', isMuted);
      setGameState('match_result');
      saveMatchHistory();
    }
  };

  // Save the match outcome to Supabase user metadata
  const saveMatchHistory = async () => {
    try {
      const currentHistory = userMetadata.match_history || [];
      const newMatch = {
        date: new Date().toISOString(),
        mode,
        subject: selectedSubject,
        player1: { name: p1Name, score: p1Score, corrects: p1Corrects },
        player2: { name: p2Name, score: p2Score, corrects: p2Corrects },
        won: p1Score > p2Score ? 'p1' : p2Score > p1Score ? 'p2' : 'draw'
      };

      await supabase.auth.updateUser({
        data: {
          ...userMetadata,
          match_history: [newMatch, ...currentHistory].slice(0, 20) // store last 20 duels
        }
      });
    } catch (e) {
      console.error('Error saving match history:', e);
    }
  };

  // Setup and shuffle match questions
  const handleStartGame = () => {
    playSound('start', isMuted);

    // Filter questions by category and subject
    let pool = [...questionsData];
    if (category === 'fen') {
      pool = pool.filter(q => q.ders !== 'Dil Bilgisi');
      if (selectedSubject !== 'all') {
        pool = pool.filter(q => q.ders === selectedSubject);
      }
    } else {
      pool = pool.filter(q => q.ders === 'Dil Bilgisi');
    }

    // Shuffle pool
    const shuffled = pool.sort(() => 0.5 - Math.random());
    // Select 10 questions
    const selected = shuffled.slice(0, 10);

    // If there aren't enough questions in the selected category, backfill
    if (selected.length < 10) {
      const extraPool = questionsData.filter(q => {
        const notSelectedYet = !selected.some(sq => sq.id === q.id);
        const correctCategory = category === 'fen' ? q.ders !== 'Dil Bilgisi' : q.ders === 'Dil Bilgisi';
        return notSelectedYet && correctCategory;
      });
      const extraShuffled = extraPool.sort(() => 0.5 - Math.random());
      const extraNeeded = 10 - selected.length;
      selected.push(...extraShuffled.slice(0, extraNeeded));
    }

    setMatchQuestions(selected);
    setCurrentQIndex(0);
    setP1Score(0);
    setP2Score(0);
    setP1Corrects(0);
    setP2Corrects(0);
    setP1AnswersList([]);
    setP2AnswersList([]);

    // Auto configure opponent name if bot
    if (mode === 'bot') {
      const botNames = {
        easy: 'Acemi Bot 🤖',
        medium: 'Çalışkan Bot 🤖',
        hard: 'Derece Botu ⚡'
      };
      setP2Name(botNames[botDifficulty]);
    }

    startRound(0, selected);
  };

  // Append a single 'Hap Bilgi' to user's notes
  const saveHapBilgiToNotes = async (qId: number, ders: string, konu: string, hapBilgi: string) => {
    setNoteSaveStatus(prev => ({ ...prev, [qId]: 'saving' }));
    try {
      const subjectKey = `tyt_${ders.replace('ı', 'i').replace('ö', 'o').toLowerCase().replace(' ', '_')}_konulari`;
      const currentNotes = userMetadata.subject_notes || {};
      const existingNote = currentNotes[subjectKey] || '';

      const newFactText = `\n• [Hap Bilgi - ${konu}]: ${hapBilgi}`;
      const updatedNote = (existingNote.trim() + newFactText).trim();

      const { error } = await supabase.auth.updateUser({
        data: {
          ...userMetadata,
          subject_notes: {
            ...currentNotes,
            [subjectKey]: updatedNote
          }
        }
      });

      if (error) throw error;
      setNoteSaveStatus(prev => ({ ...prev, [qId]: 'saved' }));
    } catch (e) {
      console.error('Error saving note:', e);
      setNoteSaveStatus(prev => ({ ...prev, [qId]: 'idle' }));
    }
  };

  // Save all match questions' Hap Bilgiler to notes
  const saveAllToNotes = async () => {
    setSavingAllNotes(true);
    try {
      const currentNotes = { ...(userMetadata.subject_notes || {}) };

      matchQuestions.forEach(q => {
        const subjectKey = `tyt_${q.ders.replace('ı', 'i').replace('ö', 'o').toLowerCase().replace(' ', '_')}_konulari`;
        const existingNote = currentNotes[subjectKey] || '';
        const newFactText = `\n• [Hap Bilgi - ${q.konu}]: ${q.hap_bilgi}`;
        currentNotes[subjectKey] = (existingNote.trim() + newFactText).trim();
      });

      const { error } = await supabase.auth.updateUser({
        data: {
          ...userMetadata,
          subject_notes: currentNotes
        }
      });

      if (error) throw error;

      // Update local state indicators
      const updatedStatus: Record<number, 'saved'> = {};
      matchQuestions.forEach(q => {
        updatedStatus[q.id] = 'saved';
      });
      setNoteSaveStatus(updatedStatus);
    } catch (e) {
      console.error('Error saving all notes:', e);
    } finally {
      setSavingAllNotes(false);
    }
  };

  const currentQuestion = matchQuestions[currentQIndex];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5 border border-zinc-700"
          >
            ← Çık
          </Link>
          <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-400 via-amber-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>⚔️</span> YKS Düello Modu
          </h1>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700 cursor-pointer text-sm"
          title={isMuted ? 'Sesi Aç' : 'Sesi Kıs'}
        >
          {isMuted ? '🔇 Mute' : '🔊 Sound'}
        </button>
      </header>

      {/* ────────────────── SETUP SCREEN ────────────────── */}
      {gameState === 'setup' && (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
          <div className="w-full bg-zinc-900/70 border border-zinc-800/80 p-6 sm:p-10 rounded-3xl backdrop-blur-lg shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -z-10" />

            <div className="text-center mb-8">
              <span className="inline-block text-5xl mb-4 animate-bounce">⚡</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Sayısal Fen Bilgi Yarışması</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
                Fizik, Kimya ve Biyoloji derslerinden özenle seçilmiş 10 hap bilgi sorusuyla yarış, hızını test et ve öğren!
              </p>
            </div>

            <div className="space-y-6">
              {/* Game Mode Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
                  1. RAKİP MODU
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setMode('bot');
                      setP2Name('YKS Botu');
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${mode === 'bot'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                  >
                    <span className="text-2xl">🤖</span>
                    <span className="font-bold text-sm">Bota Karşı Yarış</span>
                    <span className="text-[10px] opacity-75">Kendi kendine pratik yap</span>
                  </button>

                  <button
                    onClick={() => {
                      setMode('local');
                      setP2Name('Misafir Oyuncu');
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${mode === 'local'
                        ? 'bg-rose-600/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                  >
                    <span className="text-2xl">👥</span>
                    <span className="font-bold text-sm">Aynı Cihazda Düello</span>
                    <span className="text-[10px] opacity-75">Yanındaki arkadaşınla kapış</span>
                  </button>
                </div>
              </div>

              {/* Bot Difficulty (Conditional) */}
              {mode === 'bot' && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    🤖 Yapay Zeka Derecesi
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map(diff => {
                      const labels = { easy: 'Acemi', medium: 'Çalışkan', hard: 'Derece Hedefleyen' };
                      const activeCls = {
                        easy: 'bg-green-500/10 border-green-500 text-green-400',
                        medium: 'bg-amber-500/10 border-amber-500 text-amber-400',
                        hard: 'bg-red-500/10 border-red-500 text-red-400'
                      };
                      return (
                        <button
                          key={diff}
                          onClick={() => setBotDifficulty(diff)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${botDifficulty === diff
                              ? activeCls[diff]
                              : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-750'
                            }`}
                        >
                          {labels[diff]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  📂 Düello Alanı (Kategori)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setCategory('fen');
                      setSelectedSubject('all');
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${category === 'fen'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                  >
                    <span className="text-2xl">🔬</span>
                    <span className="font-bold text-sm">Sayısal Fen</span>
                    <span className="text-[10px] text-zinc-400">Fizik, Kimya, Biyoloji</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategory('turkce');
                      setSelectedSubject('Dil Bilgisi');
                    }}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${category === 'turkce'
                        ? 'bg-amber-600/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                  >
                    <span className="text-2xl">✍️</span>
                    <span className="font-bold text-sm">Türkçe Dil Bilgisi</span>
                    <span className="text-[10px] text-zinc-400">Yazım, Noktalama, Yapı...</span>
                  </button>
                </div>
              </div>

              {/* Subject Selector */}
              {category === 'fen' && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    📚 Müfredat Kapsamı
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      { id: 'all', name: 'Karma Fen', emoji: '🌟' },
                      { id: 'Fizik', name: 'Fizik', emoji: '⚛️' },
                      { id: 'Kimya', name: 'Kimya', emoji: '🧪' },
                      { id: 'Biyoloji', name: 'Biyoloji', emoji: '🧬' }
                    ] as const).map(subj => (
                      <button
                        key={subj.id}
                        onClick={() => setSelectedSubject(subj.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer text-center ${selectedSubject === subj.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-750'
                          }`}
                      >
                        <span className="text-lg">{subj.emoji}</span>
                        <span>{subj.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Names Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">1. Oyuncu Adı</label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={e => setP1Name(e.target.value.substring(0, 15))}
                    maxLength={15}
                    placeholder="Adınız"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">
                    {mode === 'bot' ? 'Yapay Zeka Adı' : '2. Oyuncu Adı'}
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value.substring(0, 15))}
                    disabled={mode === 'bot'}
                    maxLength={15}
                    placeholder={mode === 'bot' ? 'Bot' : 'Arkadaşınızın Adı'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm tracking-widest uppercase cursor-pointer"
              >
                KAPIŞMAYI BAŞLAT ⚔️
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ────────────────── GAMEPLAY & ROUND RESULTS SCREEN ────────────────── */}
      {(gameState === 'playing' || gameState === 'round_result') && currentQuestion && (
        <main className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto gap-4 p-4 items-stretch justify-center">

          {/* PLAYER 1 PANEL (Left Side - Blue) */}
          <section className="flex-1 bg-zinc-900/60 border border-blue-500/30 rounded-3xl p-5 flex flex-col justify-between items-center shadow-lg relative overflow-hidden">
            {/* Corner score */}
            <div className="absolute top-4 left-4 flex flex-col">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Skor</span>
              <span className="text-2xl font-black font-mono text-white leading-none">{p1Score}</span>
            </div>

            <div className="w-full text-center mt-3 mb-6">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 items-center justify-center text-xl mb-2">
                👤
              </div>
              <h3 className="font-bold text-base text-zinc-100">{p1Name}</h3>

              <div className="mt-2.5">
                {p1Answer === null ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700/60 rounded-full text-xs text-zinc-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
                    Düşünüyor...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400 font-bold">
                    Cevapladı ✓ {p1AnswerTime && `(${p1AnswerTime}s)`}
                  </span>
                )}
              </div>
            </div>

            {/* Left player selection panel */}
            <div className="w-full space-y-2 max-w-xs">
              <div className="text-[10px] font-bold text-center text-zinc-500 uppercase tracking-widest mb-1 hidden sm:block">
                Tuşlar: A • S • D • F
              </div>
              {(['A', 'B', 'C', 'D'] as const).map(option => {
                const isSelected = p1Answer === option;
                const isCorrect = currentQuestion.dogru_cevap === option;
                const isReview = gameState === 'round_result';

                let btnCls = "w-full py-3.5 px-4 rounded-2xl border text-sm font-bold transition-all flex justify-between items-center cursor-pointer ";

                if (!isReview) {
                  btnCls += isSelected
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-zinc-800/40 border-zinc-800 hover:border-blue-500/50 text-zinc-300 hover:text-white";
                } else {
                  // Review state
                  if (isCorrect) {
                    btnCls += "bg-green-500/15 border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)]";
                  } else if (isSelected) {
                    btnCls += "bg-red-500/15 border-red-500 text-red-400";
                  } else {
                    btnCls += "bg-zinc-850/20 border-zinc-800/40 text-zinc-500 opacity-60";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={p1Answer !== null || isReview}
                    onClick={() => submitAnswer(1, option)}
                    className={btnCls}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-xs font-black flex items-center justify-center border border-zinc-700/60 group-disabled:opacity-50">
                        {option}
                      </span>
                      <span>Seçeneği</span>
                    </span>
                    {isReview && isCorrect && <span className="text-xs">Correct ✓</span>}
                    {isReview && isSelected && !isCorrect && <span className="text-xs">Wrong ✗</span>}
                  </button>
                );
              })}
            </div>
            <div className="h-4" />
          </section>

          {/* QUESTION PANEL (Center Area) */}
          <section className="flex-[1.5] flex flex-col justify-between gap-4">

            {/* Top Stat Info Bar */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-400">
                Soru {currentQIndex + 1} / 10
              </span>
              <span className="px-3 py-1 font-bold rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {currentQuestion.ders} • {currentQuestion.konu}
              </span>
            </div>

            {/* Central Clock */}
            <div className="flex flex-col items-center justify-center p-3">
              {gameState === 'playing' ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-3xl font-black font-mono tracking-widest text-zinc-100 tabular-nums">
                    {timeLeft.toFixed(1)}s
                  </div>
                  {/* Countdown Progress Bar */}
                  <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${timeLeft <= 4 ? 'bg-red-500' : timeLeft <= 8 ? 'bg-amber-400' : 'bg-green-500'
                        }`}
                      style={{ width: `${(timeLeft / 15.0) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-1">
                  <span className="px-4 py-1.5 bg-zinc-800 border border-zinc-700/80 text-zinc-300 rounded-full font-extrabold text-xs uppercase tracking-widest animate-pulse">
                    Round Tamamlandı
                  </span>
                </div>
              )}
            </div>

            {/* Question Text Box */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 rounded-3xl flex-1 flex flex-col justify-center shadow-lg relative min-h-[160px]">
              <p className="text-base sm:text-lg leading-relaxed text-zinc-100 font-medium text-center">
                {currentQuestion.soru}
              </p>
            </div>

            {/* Options display labels (Text contents are placed here in the center, keeping player buttons clean) */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-3xl space-y-2.5">
              {Object.entries(currentQuestion.secenekler).map(([key, value]) => {
                const isCorrect = currentQuestion.dogru_cevap === key;
                const isReview = gameState === 'round_result';

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border text-sm flex gap-3 items-start transition-all ${isReview && isCorrect
                        ? 'bg-green-500/10 border-green-500/40 text-green-300'
                        : 'bg-zinc-850/40 border-zinc-800/80 text-zinc-300'
                      }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {key}
                    </span>
                    <span className="leading-tight">{value}</span>
                  </div>
                );
              })}
            </div>

            {/* REVEAL & EXPLANATION PANEL (Only visible during review phase) */}
            {gameState === 'round_result' && (
              <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 p-5 rounded-3xl shadow-xl flex flex-col gap-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase">
                  <span>💡</span> Hap Bilgi Notu
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 italic">
                  {currentQuestion.hap_bilgi}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <button
                    onClick={() => saveHapBilgiToNotes(currentQuestion.id, currentQuestion.ders, currentQuestion.konu, currentQuestion.hap_bilgi)}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-zinc-850 border border-zinc-750 text-zinc-300 hover:text-white"
                  >
                    {noteSaveStatus[currentQuestion.id] === 'saved' ? (
                      <span className="text-green-400">✓ Not Defterine Eklendi</span>
                    ) : noteSaveStatus[currentQuestion.id] === 'saving' ? (
                      <span className="animate-pulse">Kaydediliyor...</span>
                    ) : (
                      <>📝 Bu Bilgiyi Notlarıma Ekle</>
                    )}
                  </button>

                  <button
                    onClick={handleNextRound}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {currentQIndex === 9 ? 'Sonuçları Gör 📊' : 'Sonraki Soruya Geç →'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* PLAYER 2 PANEL (Right Side - Rose) */}
          <section className="flex-1 bg-zinc-900/60 border border-rose-500/30 rounded-3xl p-5 flex flex-col justify-between items-center shadow-lg relative overflow-hidden">
            {/* Corner score */}
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Skor</span>
              <span className="text-2xl font-black font-mono text-white leading-none">{p2Score}</span>
            </div>

            <div className="w-full text-center mt-3 mb-6">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 items-center justify-center text-xl mb-2">
                {mode === 'bot' ? '🤖' : '👥'}
              </div>
              <h3 className="font-bold text-base text-zinc-100">{p2Name}</h3>

              <div className="mt-2.5">
                {p2Answer === null ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700/60 rounded-full text-xs text-zinc-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
                    {mode === 'bot' ? 'Düşünüyor...' : 'Düşünüyor...'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs text-rose-400 font-bold">
                    Cevapladı ✓ {p2AnswerTime && `(${p2AnswerTime}s)`}
                  </span>
                )}
              </div>
            </div>

            {/* Right player selection panel */}
            <div className="w-full space-y-2 max-w-xs">
              <div className="text-[10px] font-bold text-center text-zinc-500 uppercase tracking-widest mb-1 hidden sm:block">
                {mode === 'local' ? 'Tuşlar: H • J • K • L' : 'Sistem Kontrolü'}
              </div>
              {(['A', 'B', 'C', 'D'] as const).map(option => {
                const isSelected = p2Answer === option;
                const isCorrect = currentQuestion.dogru_cevap === option;
                const isReview = gameState === 'round_result';

                let btnCls = "w-full py-3.5 px-4 rounded-2xl border text-sm font-bold transition-all flex justify-between items-center ";
                if (mode === 'local') btnCls += "cursor-pointer ";

                if (!isReview) {
                  btnCls += isSelected
                    ? "bg-rose-600/20 border-rose-500 text-rose-300"
                    : "bg-zinc-800/40 border-zinc-800 hover:border-rose-500/50 text-zinc-300 hover:text-white";
                } else {
                  // Review state
                  if (isCorrect) {
                    btnCls += "bg-green-500/15 border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.15)]";
                  } else if (isSelected) {
                    btnCls += "bg-red-500/15 border-red-500 text-red-400";
                  } else {
                    btnCls += "bg-zinc-850/20 border-zinc-800/40 text-zinc-500 opacity-60";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={mode === 'bot' || p2Answer !== null || isReview}
                    onClick={() => submitAnswer(2, option)}
                    className={btnCls}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-xs font-black flex items-center justify-center border border-zinc-700/60 group-disabled:opacity-50">
                        {option}
                      </span>
                      <span>Seçeneği</span>
                    </span>
                    {isReview && isCorrect && <span className="text-xs">Correct ✓</span>}
                    {isReview && isSelected && !isCorrect && <span className="text-xs">Wrong ✗</span>}
                  </button>
                );
              })}
            </div>
            <div className="h-4" />
          </section>

        </main>
      )}

      {/* ────────────────── MATCH RESULT SCREEN ────────────────── */}
      {gameState === 'match_result' && (
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
          <div className="w-full bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-10 rounded-3xl backdrop-blur-lg shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />

            <div className="text-center mb-8">
              <span className="inline-block text-5xl mb-4">🏆</span>
              <h2 className="text-3xl font-extrabold text-white">Kapışma Tamamlandı!</h2>
              <p className="text-zinc-400 text-xs mt-1">YKS Sayısal Fen 10 Soruluk Set</p>
            </div>

            {/* Duel Score Card */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-zinc-950/60 border border-zinc-800 rounded-3xl p-6 mb-8 items-center text-center relative">
              {/* Player 1 Card */}
              <div className="space-y-1">
                <span className="text-2xl">👤</span>
                <h4 className="font-extrabold text-sm sm:text-base text-blue-400 line-clamp-1">{p1Name}</h4>
                <div className="text-3xl font-black font-mono text-white mt-1.5">{p1Score}</div>
                <div className="text-[10px] text-zinc-500 font-semibold">{p1Corrects} / 10 Doğru</div>
              </div>

              {/* VERSUS ICON & CROWN */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-zinc-600 font-black tracking-widest text-xs uppercase">VS</span>
                <div className="mt-3 px-3 py-1 bg-zinc-800 border border-zinc-700/60 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  {p1Score > p2Score ? `${p1Name} KAZANDI!` : p2Score > p1Score ? `${p2Name} KAZANDI!` : 'BERABERE!'}
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="space-y-1">
                <span className="text-2xl">{mode === 'bot' ? '🤖' : '👥'}</span>
                <h4 className="font-extrabold text-sm sm:text-base text-rose-400 line-clamp-1">{p2Name}</h4>
                <div className="text-3xl font-black font-mono text-white mt-1.5">{p2Score}</div>
                <div className="text-[10px] text-zinc-500 font-semibold">{p2Corrects} / 10 Doğru</div>
              </div>
            </div>

            {/* MATCH HAP BİLGİLERİ SECTION */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
                    <span>💡</span> Bu Maçın Hap Bilgileri (YKS Hap Notları)
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Sorulardaki özet bilgileri ders notlarına ekleyerek dilediğin zaman çalışabilirsin.
                  </p>
                </div>
                <button
                  onClick={saveAllToNotes}
                  disabled={savingAllNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingAllNotes ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>📥 Hepsini Notlarıma Ekle</>
                  )}
                </button>
              </div>

              {/* Scrollable list of match questions & their facts */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {matchQuestions.map((q, idx) => {
                  const isP1Correct = p1AnswersList[idx] === q.dogru_cevap;
                  const isP2Correct = p2AnswersList[idx] === q.dogru_cevap;

                  return (
                    <div
                      key={q.id}
                      className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl hover:border-zinc-750 transition-colors flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-500">Soru {idx + 1}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            {q.ders}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-350">{q.konu}</span>
                        </div>

                        {/* Player score indicator for this question */}
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                          <span className={`px-1.5 py-0.5 rounded ${isP1Correct ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                            {p1Name}: {isP1Correct ? '✓' : '✗'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${isP2Correct ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                            {p2Name}: {isP2Correct ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 leading-normal border-l-2 border-zinc-800 pl-2.5">
                        {q.soru}
                      </p>

                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Hap Bilgi</span>
                          <p className="text-[11px] leading-relaxed text-zinc-300">{q.hap_bilgi}</p>
                        </div>
                        <button
                          onClick={() => saveHapBilgiToNotes(q.id, q.ders, q.konu, q.hap_bilgi)}
                          className="p-1 px-2.5 bg-zinc-850 hover:bg-zinc-800 text-[10px] font-extrabold rounded-lg text-zinc-300 transition-colors shrink-0 cursor-pointer border border-zinc-750"
                        >
                          {noteSaveStatus[q.id] === 'saved' ? 'Eklendi ✓' : 'Ekle +'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setGameState('setup')}
                className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md active:scale-95 border border-zinc-700 cursor-pointer text-center"
              >
                🔄 Yeniden Oyna
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer text-center"
              >
                🏠 Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
