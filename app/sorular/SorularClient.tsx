'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// TypeScript interfaces matching the plan
interface WrongQuestion {
  id: string;
  subject: string; 
  topic?: string;
  questionText: string;
  imageUrl?: string;
  correctAnswer?: string;
  userAnswer?: string;
  options?: Record<string, string>;
  solutionText?: string;
  examId?: string;
  createdAt: number;
  status: 'pending' | 'resolved';
}

interface PracticeExam {
  id: string;
  title: string;
  type: 'TYT' | 'AYT';
  date: string;
  notes?: string;
  createdAt: number;
  tytScores?: {
    turkishCorrect: number;  turkishWrong: number;
    socialCorrect: number;   socialWrong: number;
    mathCorrect: number;     mathWrong: number;
    scienceCorrect: number;  scienceWrong: number;
  };
  aytScores?: {
    mathCorrect: number;     mathWrong: number;
    literatureCorrect: number; literatureWrong: number;
    history1Correct: number; history1Wrong: number;
    geography1Correct: number; geography1Wrong: number;
    history2Correct: number; geography2Wrong: number;
    geography2Correct: number; history2Wrong: number; // mapping matching ayt schema
    philosophyCorrect: number; philosophyWrong: number;
    religionCorrect: number; religionWrong: number;
    physicsCorrect: number;  physicsWrong: number;
    chemistryCorrect: number; chemistryWrong: number;
    biologyCorrect: number;  biologyWrong: number;
  };
}

interface SorularClientProps {
  initialWrongQuestions: WrongQuestion[];
  initialPracticeExams: PracticeExam[];
  userEmail: string | null;
}

const subjectMeta: Record<string, { icon: string; label: string; bg: string; darkBg: string; color: string; border: string }> = {
  matematik: { icon: '📐', label: 'Matematik', bg: 'bg-blue-50/60', darkBg: 'dark:bg-blue-950/15', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' },
  fizik: { icon: '⚛️', label: 'Fizik', bg: 'bg-purple-50/60', darkBg: 'dark:bg-purple-950/15', color: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/30' },
  kimya: { icon: '🧪', label: 'Kimya', bg: 'bg-emerald-50/60', darkBg: 'dark:bg-emerald-950/15', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
  biyoloji: { icon: '🧬', label: 'Biyoloji', bg: 'bg-rose-50/60', darkBg: 'dark:bg-rose-950/15', color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30' },
  dil_bilgisi: { icon: '✍️', label: 'Türkçe', bg: 'bg-amber-50/60', darkBg: 'dark:bg-amber-950/15', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
  diğer: { icon: '📚', label: 'Diğer / Genel', bg: 'bg-zinc-100/60', darkBg: 'dark:bg-zinc-800/30', color: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-800' }
};

export default function SorularClient({ initialWrongQuestions, initialPracticeExams, userEmail }: SorularClientProps) {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>(initialWrongQuestions);
  const [practiceExams, setPracticeExams] = useState<PracticeExam[]>(initialPracticeExams);
  
  // Navigation tabs: 'defter' or 'denemeler'
  const [activeTab, setActiveTab] = useState<'defter' | 'denemeler'>('defter');

  // Sync statuses
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Wrong Questions UI states
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<string>('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [questionSearch, setQuestionSearch] = useState('');
  
  // Modals / Drawer toggles
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<WrongQuestion | null>(null);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  // Random question modal state (Practice mode)
  const [randomQuestion, setRandomQuestion] = useState<WrongQuestion | null>(null);
  const [randomAnswerRevealed, setRandomAnswerRevealed] = useState(false);

  // ── Manual Question Form States ──
  const [qSubject, setQSubject] = useState('matematik');
  const [qTopic, setQTopic] = useState('');
  const [qText, setQText] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qImageFile, setQImageFile] = useState<File | null>(null);
  const [qImagePreview, setQImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [qCorrect, setQCorrect] = useState('');
  const [qUserAnswer, setQUserAnswer] = useState('');
  const [qSolution, setQSolution] = useState('');
  const [qExamId, setQExamId] = useState('');
  const [qEditId, setQEditId] = useState<string | null>(null); // null if new question

  // ── Practice Exam Form States ──
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT'>('TYT');
  const [examDate, setExamDate] = useState(new Date().toISOString().substring(0, 10));
  const [examNotes, setExamNotes] = useState('');
  
  // TYT correct/wrong counts
  const [tytTrC, setTytTrC] = useState(0);   const [tytTrW, setTytTrW] = useState(0);
  const [tytSocC, setTytSocC] = useState(0); const [tytSocW, setTytSocW] = useState(0);
  const [tytMatC, setTytMatC] = useState(0); const [tytMatW, setTytMatW] = useState(0);
  const [tytSciC, setTytSciC] = useState(0); const [tytSciW, setTytSciW] = useState(0);

  // AYT correct/wrong counts
  const [aytMatC, setAytMatC] = useState(0);   const [aytMatW, setAytMatW] = useState(0);
  const [aytLitC, setAytLitC] = useState(0);   const [aytLitW, setAytLitW] = useState(0);
  const [aytHist1C, setAytHist1C] = useState(0); const [aytHist1W, setAytHist1W] = useState(0);
  const [aytGeo1C, setAytGeo1C] = useState(0); const [aytGeo1W, setAytGeo1W] = useState(0);
  const [aytHist2C, setAytHist2C] = useState(0); const [aytHist2W, setAytHist2W] = useState(0);
  const [aytGeo2C, setAytGeo2C] = useState(0); const [aytGeo2W, setAytGeo2W] = useState(0);
  const [aytPhilC, setAytPhilC] = useState(0); const [aytPhilW, setAytPhilW] = useState(0);
  const [aytRelC, setAytRelC] = useState(0);   const [aytRelW, setAytRelW] = useState(0);
  const [aytPhysC, setAytPhysC] = useState(0); const [aytPhysW, setAytPhysW] = useState(0);
  const [aytChemC, setAytChemC] = useState(0); const [aytChemW, setAytChemW] = useState(0);
  const [aytBioC, setAytBioC] = useState(0);   const [aytBioW, setAytBioW] = useState(0);

  const supabase = createClient();

  // Helper function to sync with Supabase Auth metadata
  const syncToSupabase = async (nextQuestions: WrongQuestion[], nextExams: PracticeExam[]) => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentMeta = user.user_metadata || {};
        await supabase.auth.updateUser({
          data: {
            ...currentMeta,
            wrong_questions: nextQuestions,
            practice_exams: nextExams
          }
        });
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 2000);
      }
    } catch (e) {
      console.error('Soru/Deneme verileri kaydedilirken hata oluştu:', e);
    } finally {
      setSyncing(false);
    }
  };

  // ── Wrong Question Actions ──
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() && !qImageUrl && !qImageFile) {
      alert('Lütfen bir soru metni girin veya resim yükleyin.');
      return;
    }

    let finalImageUrl = qImageUrl;

    if (qImageFile) {
      setImageUploading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Kullanıcı bulunamadı.');

        const fileExt = qImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('wrong-questions')
          .upload(fileName, qImageFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('wrong-questions')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      } catch (err: any) {
        console.error('Görsel yükleme hatası:', err);
        alert(
          `Resim yüklenemedi. Supabase Storage panelinizde 'wrong-questions' adında Public bir bucket oluşturduğunuzdan ve RLS izinlerinin açık olduğundan emin olun.\n\nHata detayı: ${err.message || err}`
        );
        setImageUploading(false);
        return;
      } finally {
        setImageUploading(false);
      }
    }

    let updatedQuestions: WrongQuestion[];

    if (qEditId) {
      // Editing existing question
      updatedQuestions = wrongQuestions.map(q => 
        q.id === qEditId 
          ? {
              ...q,
              subject: qSubject,
              topic: qTopic.trim() || undefined,
              questionText: qText.trim(),
              imageUrl: finalImageUrl || undefined,
              correctAnswer: qCorrect.trim() || undefined,
              userAnswer: qUserAnswer.trim() || undefined,
              solutionText: qSolution.trim() || undefined,
              examId: qExamId || undefined
            }
          : q
      );
    } else {
      // Adding new question
      const newQuestion: WrongQuestion = {
        id: `q_${Date.now()}`,
        subject: qSubject,
        topic: qTopic.trim() || undefined,
        questionText: qText.trim(),
        imageUrl: finalImageUrl || undefined,
        correctAnswer: qCorrect.trim() || undefined,
        userAnswer: qUserAnswer.trim() || undefined,
        solutionText: qSolution.trim() || undefined,
        examId: qExamId || undefined,
        createdAt: Date.now(),
        status: 'pending'
      };
      updatedQuestions = [newQuestion, ...wrongQuestions];
    }

    setWrongQuestions(updatedQuestions);
    syncToSupabase(updatedQuestions, practiceExams);
    resetQuestionForm();
    setIsQuestionModalOpen(false);
  };

  const handleToggleQuestionStatus = (id: string) => {
    const updated: WrongQuestion[] = wrongQuestions.map(q => {
      if (q.id === id) {
        return { ...q, status: q.status === 'pending' ? 'resolved' : 'pending' };
      }
      return q;
    });
    setWrongQuestions(updated);
    syncToSupabase(updated, practiceExams);
    
    // Update active modal display if open
    if (selectedQuestion && selectedQuestion.id === id) {
      setSelectedQuestion(prev => prev ? { ...prev, status: prev.status === 'pending' ? 'resolved' : 'pending' } : null);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      const updated = wrongQuestions.filter(q => q.id !== id);
      setWrongQuestions(updated);
      syncToSupabase(updated, practiceExams);
      setSelectedQuestion(null);
    }
  };

  const handleEditQuestionClick = (q: WrongQuestion) => {
    setQEditId(q.id);
    setQSubject(q.subject);
    setQTopic(q.topic || '');
    setQText(q.questionText);
    setQImageUrl(q.imageUrl || '');
    setQImagePreview(q.imageUrl || null);
    setQImageFile(null);
    setQCorrect(q.correctAnswer || '');
    setQUserAnswer(q.userAnswer || '');
    setQSolution(q.solutionText || '');
    setQExamId(q.examId || '');
    
    setIsQuestionModalOpen(true);
    setSelectedQuestion(null); // Close detail modal
  };

  const resetQuestionForm = () => {
    setQEditId(null);
    setQSubject('matematik');
    setQTopic('');
    setQText('');
    setQImageUrl('');
    setQImagePreview(null);
    setQImageFile(null);
    setQCorrect('');
    setQUserAnswer('');
    setQSolution('');
    setQExamId('');
  };

  // ── Practice Exam Actions ──
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    const newExam: PracticeExam = {
      id: `exam_${Date.now()}`,
      title: examTitle.trim(),
      type: examType,
      date: examDate,
      notes: examNotes.trim() || undefined,
      createdAt: Date.now(),
      tytScores: examType === 'TYT' ? {
        turkishCorrect: tytTrC,  turkishWrong: tytTrW,
        socialCorrect: tytSocC,   socialWrong: tytSocW,
        mathCorrect: tytMatC,     mathWrong: tytMatW,
        scienceCorrect: tytSciC,  scienceWrong: tytSciW,
      } : undefined,
      aytScores: examType === 'AYT' ? {
        mathCorrect: aytMatC,     mathWrong: aytMatW,
        literatureCorrect: aytLitC, literatureWrong: aytLitW,
        history1Correct: aytHist1C, history1Wrong: aytHist1W,
        geography1Correct: aytGeo1C, geography1Wrong: aytGeo1W,
        history2Correct: aytHist2C, geography2Wrong: aytGeo2W, // matches structure mapping
        geography2Correct: aytGeo2C, history2Wrong: aytHist2W,
        philosophyCorrect: aytPhilC, philosophyWrong: aytPhilW,
        religionCorrect: aytRelC,   religionWrong: aytRelW,
        physicsCorrect: aytPhysC,  physicsWrong: aytPhysW,
        chemistryCorrect: aytChemC, chemistryWrong: aytChemW,
        biologyCorrect: aytBioC,   biologyWrong: aytBioW,
      } : undefined
    };

    const updatedExams = [newExam, ...practiceExams];
    setPracticeExams(updatedExams);
    syncToSupabase(wrongQuestions, updatedExams);
    resetExamForm();
    setIsExamModalOpen(false);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('Bu deneme sınavını silmek istediğinize emin misiniz? (İlişkili yanlış sorular silinmez, ancak sınav bağları kaldırılır)')) {
      const updatedExams = practiceExams.filter(ex => ex.id !== id);
      const updatedQuestions = wrongQuestions.map(q => q.examId === id ? { ...q, examId: undefined } : q);
      
      setPracticeExams(updatedExams);
      setWrongQuestions(updatedQuestions);
      syncToSupabase(updatedQuestions, updatedExams);
      if (expandedExamId === id) setExpandedExamId(null);
    }
  };

  const resetExamForm = () => {
    setExamTitle('');
    setExamType('TYT');
    setExamDate(new Date().toISOString().substring(0, 10));
    setExamNotes('');
    
    // reset TYT inputs
    setTytTrC(0);   setTytTrW(0);
    setTytSocC(0); setTytSocW(0);
    setTytMatC(0); setTytMatW(0);
    setTytSciC(0); setTytSciW(0);

    // reset AYT inputs
    setAytMatC(0);   setAytMatW(0);
    setAytLitC(0);   setAytLitW(0);
    setAytHist1C(0); setAytHist1W(0);
    setAytGeo1C(0); setAytGeo1W(0);
    setAytHist2C(0); setAytHist2W(0);
    setAytGeo2C(0); setAytGeo2W(0);
    setAytPhilC(0); setAytPhilW(0);
    setAytRelC(0);   setAytRelW(0);
    setAytPhysC(0); setAytPhysW(0);
    setAytChemC(0); setAytChemW(0);
    setAytBioC(0);   setAytBioW(0);
  };

  // Quick action: Add wrong question from a specific exam
  const handleAddQuestionFromExamClick = (exam: PracticeExam) => {
    resetQuestionForm();
    setQExamId(exam.id);
    setActiveTab('defter');
    setIsQuestionModalOpen(true);
  };

  // Practice session mode: Select a random pending question
  const startRandomPractice = () => {
    const pendings = wrongQuestions.filter(q => q.status === 'pending');
    if (pendings.length === 0) {
      alert('Tüm yanlış sorularını çözmüşsün! Tebrikler. 🌟 Yeni soru ekle.');
      return;
    }
    const randomIndex = Math.floor(Math.random() * pendings.length);
    setRandomQuestion(pendings[randomIndex]);
    setRandomAnswerRevealed(false);
  };

  // Calculations for Net counts
  const calculateTytNet = (scores: PracticeExam['tytScores']) => {
    if (!scores) return 0;
    const trNet = scores.turkishCorrect - (scores.turkishWrong * 0.25);
    const socNet = scores.socialCorrect - (scores.socialWrong * 0.25);
    const matNet = scores.mathCorrect - (scores.mathWrong * 0.25);
    const sciNet = scores.scienceCorrect - (scores.scienceWrong * 0.25);
    return Number((trNet + socNet + matNet + sciNet).toFixed(2));
  };

  const calculateAytNet = (scores: PracticeExam['aytScores']) => {
    if (!scores) return 0;
    let netSum = 0;
    Object.entries(scores).forEach(([key, val]) => {
      // Loop matches format of correct / wrong fields
      if (key.endsWith('Correct')) {
        const wrongKey = key.replace('Correct', 'Wrong');
        const wrongVal = (scores as any)[wrongKey] || 0;
        netSum += (val - (wrongVal * 0.25));
      }
    });
    return Number(netSum.toFixed(2));
  };

  const getExamNet = (exam: PracticeExam) => {
    if (exam.type === 'TYT') return calculateTytNet(exam.tytScores);
    return calculateAytNet(exam.aytScores);
  };

  // Filtered & Sorted Lists
  const filteredWrongQuestions = useMemo(() => {
    return wrongQuestions.filter(q => {
      const matchesSubject = questionSubjectFilter === 'all' || q.subject === questionSubjectFilter;
      const matchesStatus = questionStatusFilter === 'all' || q.status === questionStatusFilter;
      const matchesSearch = q.questionText.toLowerCase().includes(questionSearch.toLowerCase()) || 
                            (q.topic && q.topic.toLowerCase().includes(questionSearch.toLowerCase()));
      return matchesSubject && matchesStatus && matchesSearch;
    });
  }, [wrongQuestions, questionSubjectFilter, questionStatusFilter, questionSearch]);

  const sortedExams = useMemo(() => {
    return [...practiceExams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [practiceExams]);

  // Visual Statistics computations
  const examStats = useMemo(() => {
    const tyts = practiceExams.filter(ex => ex.type === 'TYT');
    const ayts = practiceExams.filter(ex => ex.type === 'AYT');

    const tytNets = tyts.map(ex => calculateTytNet(ex.tytScores));
    const aytNets = ayts.map(ex => calculateAytNet(ex.aytScores));

    const avgTyt = tytNets.length ? Number((tytNets.reduce((a,b)=>a+b, 0) / tytNets.length).toFixed(2)) : 0;
    const maxTyt = tytNets.length ? Math.max(...tytNets) : 0;

    const avgAyt = aytNets.length ? Number((aytNets.reduce((a,b)=>a+b, 0) / aytNets.length).toFixed(2)) : 0;
    const maxAyt = aytNets.length ? Math.max(...aytNets) : 0;

    return {
      total: practiceExams.length,
      tytCount: tyts.length,
      aytCount: ayts.length,
      avgTyt,
      maxTyt,
      avgAyt,
      maxAyt
    };
  }, [practiceExams]);

  // SVG Chart rendering helper
  const renderSvgChart = () => {
    if (sortedExams.length < 2) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 font-bold p-8">
          Grafik oluşturmak için en az 2 deneme sınavı kaydetmelisiniz.
        </div>
      );
    }

    const width = 600;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;

    // Get max and min nets for vertical scale
    const nets = sortedExams.map(ex => getExamNet(ex));
    const maxNetVal = Math.max(...nets, 120); // 120 is absolute max limit for YKS
    const minNetVal = Math.min(...nets, 0);

    const netRange = maxNetVal - minNetVal || 10;

    // Map each sorted exam to a Coordinate (x, y)
    const points = sortedExams.map((ex, idx) => {
      const net = getExamNet(ex);
      const x = paddingX + (idx / (sortedExams.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((net - minNetVal) / netRange) * (height - 2 * paddingY);
      return { x, y, net, title: ex.title, type: ex.type, date: ex.date };
    });

    // Generate path line
    let tytPath = '';
    let aytPath = '';
    
    // To make separate lines or a unified line. Since TYT and AYT are separate exams, let's draw separate lines:
    const tytPoints = points.filter(p => p.type === 'TYT');
    const aytPoints = points.filter(p => p.type === 'AYT');

    if (tytPoints.length > 1) {
      tytPath = `M ${tytPoints[0].x} ${tytPoints[0].y} ` + tytPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    if (aytPoints.length > 1) {
      aytPath = `M ${aytPoints[0].x} ${aytPoints[0].y} ` + aytPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-zinc-400 dark:text-zinc-650 overflow-visible">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((val, i) => {
          const y = paddingY + val * (height - 2 * paddingY);
          const gridVal = Number((maxNetVal - val * netRange).toFixed(1));
          return (
            <g key={i} className="opacity-40">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" />
              <text x={paddingX - 10} y={y + 3} textAnchor="end" className="text-[9px] font-mono font-bold dark:fill-zinc-400 fill-zinc-600">{gridVal}</text>
            </g>
          );
        })}

        {/* TYT Line */}
        {tytPath && (
          <path d={tytPath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm animate-drawPath" />
        )}

        {/* AYT Line */}
        {aytPath && (
          <path d={aytPath} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm animate-drawPath" />
        )}

        {/* Dots on points */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              className={`transition-all duration-150 ${p.type === 'TYT' ? 'fill-blue-500 hover:r-6' : 'fill-purple-500 hover:r-6'}`}
            />
            {/* Hover Tooltip inside SVG */}
            <title>{`${p.title} (${p.type}): ${p.net} Net - ${p.date}`}</title>
            <circle
              cx={p.x}
              cy={p.y}
              r="10"
              className="fill-transparent hover:fill-zinc-500/10"
            />
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${width - 150}, 10)`} className="text-[10px] font-bold">
          <circle cx="10" cy="5" r="4.5" fill="#3b82f6" />
          <text x="20" y="8" className="dark:fill-zinc-400 fill-zinc-600">TYT</text>
          
          <circle cx="70" cy="5" r="4.5" fill="#a855f7" />
          <text x="80" y="8" className="dark:fill-zinc-400 fill-zinc-600">AYT</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center z-10 sticky top-0 shadow-sm animate-fadeIn">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Ana Sayfa</span>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <span>✏️</span> Soru & Deneme Takibi
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {syncing ? (
            <span className="text-xs text-amber-500 font-medium animate-pulse flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-250/25">
              💾 Senkronize ediliyor...
            </span>
          ) : syncSuccess ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-250/25">
              ✓ Buluta Kaydedildi
            </span>
          ) : (
            <span className="text-xs text-zinc-450 dark:text-zinc-500 font-mono hidden sm:inline-block bg-zinc-100 dark:bg-zinc-850 px-2.5 py-1 rounded-full border dark:border-zinc-800">
              👤 {userEmail}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 pb-1 select-none">
          <button
            onClick={() => setActiveTab('defter')}
            className={`px-5 py-3 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'defter'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>📖</span> Yanlış Soru Defteri
            {wrongQuestions.filter(q => q.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold animate-pulse">
                {wrongQuestions.filter(q => q.status === 'pending').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('denemeler')}
            className={`px-5 py-3 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'denemeler'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>📈</span> Deneme Sınavı Takibi
            {practiceExams.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-bold">
                {practiceExams.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: YANLIŞ SORU DEFTERİ ── */}
        {activeTab === 'defter' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Notebook Actions Bar */}
            <div className="grid md:grid-cols-12 gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm">
              <div className="md:col-span-4 relative">
                <input
                  type="text"
                  placeholder="Soru veya konu ara..."
                  value={questionSearch}
                  onChange={e => setQuestionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-zinc-400 absolute left-3 top-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>

              <div className="md:col-span-3">
                <select
                  value={questionSubjectFilter}
                  onChange={e => setQuestionSubjectFilter(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-250 focus:outline-none font-bold"
                >
                  <option value="all">Tüm Dersler</option>
                  {Object.entries(subjectMeta).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={questionStatusFilter}
                  onChange={e => setQuestionStatusFilter(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-250 dark:border-zinc-800 text-zinc-850 dark:text-zinc-250 focus:outline-none font-bold"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">⏳ Çözülecekler</option>
                  <option value="resolved">✓ Anlaşılanlar</option>
                </select>
              </div>

              <div className="md:col-span-3 flex gap-2 w-full">
                <button
                  onClick={startRandomPractice}
                  className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1"
                  title="Yanlış sorularından rastgele seç ve tekrar çözmeye çalış!"
                >
                  🎲 Pratik Yap
                </button>
                <button
                  onClick={() => { resetQuestionForm(); setIsQuestionModalOpen(true); }}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1"
                >
                  ➕ Soru Ekle
                </button>
              </div>
            </div>

            {/* Questions Grid */}
            {filteredWrongQuestions.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
                <span className="text-5xl select-none">📖</span>
                <div>
                  <h3 className="font-extrabold text-base dark:text-white">Yanlış Soru Bulunamadı</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Kriterlere uyan yanlış soru bulunamadı. Matematik çözümlerinden yanlış yapıldığında buraya otomatik düşecektir veya elle soru ekleyebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 font-bold text-xs rounded-xl transition-all cursor-pointer border dark:border-zinc-700"
                >
                  İlk Yanlış Sorunu Ekle ➕
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWrongQuestions.map(q => {
                  const meta = subjectMeta[q.subject] || subjectMeta['diğer'];
                  const linkedExam = practiceExams.find(ex => ex.id === q.examId);
                  
                  return (
                    <div
                      key={q.id}
                      className={`bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer ${
                        q.status === 'resolved' ? 'border-green-500/40 dark:border-green-950/40' : ''
                      }`}
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <div className="p-5 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${meta.bg} ${meta.color} ${meta.border} border`}>
                            {meta.icon} {meta.label}
                          </span>
                          
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleQuestionStatus(q.id);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold cursor-pointer border ${
                              q.status === 'resolved'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                            }`}
                          >
                            {q.status === 'resolved' ? '✓ Anlaşıldı' : '⏳ Çözülecek'}
                          </span>
                        </div>

                        {q.topic && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wide">
                            Konu: {q.topic}
                          </div>
                        )}

                        {q.imageUrl && (
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-850/50 border dark:border-zinc-800 select-none mb-2">
                            <img src={q.imageUrl} alt="Soru" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}

                        <p className="text-sm leading-relaxed dark:text-zinc-100 font-medium line-clamp-4 text-justify">
                          {q.questionText}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-955/30 border-t dark:border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-500 select-none">
                        <span>
                          {new Date(q.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        {linkedExam ? (
                          <span className="text-purple-600 dark:text-purple-400 truncate max-w-[130px]" title={`Deneme: ${linkedExam.title}`}>
                            📝 {linkedExam.title}
                          </span>
                        ) : (
                          <span>El ile eklendi</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: DENEME SINAVI TAKİBİ ── */}
        {activeTab === 'denemeler' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Visual Stats Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm text-center">
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Toplam Sınav</span>
                <span className="text-3xl font-black font-mono mt-1 block dark:text-white">{examStats.total}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm text-center">
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">Ortalama TYT</span>
                <span className="text-3xl font-black font-mono mt-1 block text-blue-600 dark:text-blue-400">{examStats.avgTyt}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm text-center">
                <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block">En Yüksek TYT</span>
                <span className="text-3xl font-black font-mono mt-1 block text-blue-600 dark:text-blue-400">{examStats.maxTyt}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm text-center">
                <span className="text-[9px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest block">Ortalama AYT</span>
                <span className="text-3xl font-black font-mono mt-1 block text-purple-650 dark:text-purple-400">{examStats.avgAyt}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 shadow-sm text-center col-span-2 sm:col-span-1">
                <span className="text-[9px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest block">En Yüksek AYT</span>
                <span className="text-3xl font-black font-mono mt-1 block text-purple-650 dark:text-purple-400">{examStats.maxAyt}</span>
              </div>
            </div>

            {/* SVG Chart Section */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5 dark:text-white">
                    <span>📈</span> Net Score İlerleme Grafiği
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Zaman içerisindeki net grafiğiniz</p>
                </div>
                
                <button
                  onClick={() => setIsExamModalOpen(true)}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1"
                >
                  ➕ Yeni Deneme Ekle
                </button>
              </div>
              
              <div className="w-full h-48 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-2xl border border-dashed dark:border-zinc-800 p-2 relative overflow-hidden">
                {renderSvgChart()}
              </div>
            </div>

            {/* Practice Exam List */}
            {practiceExams.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
                <span className="text-5xl select-none">📊</span>
                <div>
                  <h3 className="font-extrabold text-base dark:text-white">Henüz Deneme Eklenmemiş</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Net gelişimini takip edebilmek ve sınav sorularını defterine bağlamak için ilk deneme sınavını kaydet.
                  </p>
                </div>
                <button
                  onClick={() => setIsExamModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  İlk Deneme Sınavını Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Deneme Geçmişi</h3>
                
                {practiceExams.map(ex => {
                  const isExpanded = expandedExamId === ex.id;
                  const totalNet = getExamNet(ex);
                  const examMistakes = wrongQuestions.filter(q => q.examId === ex.id);

                  return (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedExamId(isExpanded ? null : ex.id)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-955/10 transition-colors select-none"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-black shadow-inner ${
                            ex.type === 'TYT'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border dark:border-blue-900/30'
                              : 'bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-455 border dark:border-purple-900/30'
                          }`}>
                            {ex.type}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {ex.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                              Tarih: {new Date(ex.date).toLocaleDateString('tr-TR')} • {examMistakes.length} yanlış soru
                            </p>
                          </div>
                        </div>

                        {/* Net Score Badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xl font-black font-mono tracking-tight text-zinc-800 dark:text-zinc-100">
                              {totalNet}
                            </span>
                            <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">NET SKOR</span>
                          </div>
                          
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Accordion Expanded Detail Breakdown */}
                      {isExpanded && (
                        <div className="border-t dark:border-zinc-800 p-5 bg-zinc-50/10 dark:bg-zinc-950/20 space-y-6">
                          
                          {/* Subject Score Table */}
                          <div className="overflow-x-auto rounded-xl border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                            <table className="w-full text-left border-collapse text-xs select-text">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 border-b dark:border-zinc-800 font-bold">
                                  <th className="p-3">Ders / Bölüm</th>
                                  <th className="p-3 text-center">Doğru</th>
                                  <th className="p-3 text-center">Yanlış</th>
                                  <th className="p-3 text-center">Net</th>
                                  <th className="p-3 hidden sm:table-cell">Başarı Oranı</th>
                                </tr>
                              </thead>
                              <tbody className="font-medium">
                                {ex.type === 'TYT' && ex.tytScores && (
                                  <>
                                    {[
                                      { name: 'Türkçe', c: ex.tytScores.turkishCorrect, w: ex.tytScores.turkishWrong, max: 40, color: 'bg-amber-500' },
                                      { name: 'Sosyal Bilimler', c: ex.tytScores.socialCorrect, w: ex.tytScores.socialWrong, max: 20, color: 'bg-emerald-500' },
                                      { name: 'Temel Matematik', c: ex.tytScores.mathCorrect, w: ex.tytScores.mathWrong, max: 40, color: 'bg-blue-500' },
                                      { name: 'Fen Bilimleri', c: ex.tytScores.scienceCorrect, w: ex.tytScores.scienceWrong, max: 20, color: 'bg-rose-500' }
                                    ].map(sub => {
                                      const net = Number((sub.c - sub.w * 0.25).toFixed(2));
                                      const pct = sub.max > 0 ? Math.max(0, Math.round((net / sub.max) * 100)) : 0;
                                      return (
                                        <tr key={sub.name} className="border-b dark:border-zinc-800 last:border-0 hover:bg-zinc-50/20 dark:hover:bg-zinc-955/10">
                                          <td className="p-3 font-bold dark:text-zinc-200">{sub.name}</td>
                                          <td className="p-3 text-center text-green-600 font-bold">{sub.c}</td>
                                          <td className="p-3 text-center text-red-500 font-bold">{sub.w}</td>
                                          <td className="p-3 text-center font-black dark:text-white font-mono">{net}</td>
                                          <td className="p-3 hidden sm:table-cell">
                                            <div className="flex items-center gap-3">
                                              <div className="h-2 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${sub.color}`} style={{ width: `${pct}%` }} />
                                              </div>
                                              <span className="text-[10px] font-mono text-zinc-400 font-bold">% {pct}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </>
                                )}

                                {ex.type === 'AYT' && ex.aytScores && (
                                  <>
                                    {[
                                      { name: 'Matematik', c: ex.aytScores.mathCorrect, w: ex.aytScores.mathWrong, max: 40, color: 'bg-blue-500' },
                                      { name: 'Edebiyat', c: ex.aytScores.literatureCorrect, w: ex.aytScores.literatureWrong, max: 24, color: 'bg-amber-500' },
                                      { name: 'Tarih 1', c: ex.aytScores.history1Correct, w: ex.aytScores.history1Wrong, max: 10, color: 'bg-amber-600' },
                                      { name: 'Coğrafya 1', c: ex.aytScores.geography1Correct, w: ex.aytScores.geography1Wrong, max: 6, color: 'bg-orange-500' },
                                      { name: 'Fizik', c: ex.aytScores.physicsCorrect, w: ex.aytScores.physicsWrong, max: 14, color: 'bg-purple-500' },
                                      { name: 'Kimya', c: ex.aytScores.chemistryCorrect, w: ex.aytScores.chemistryWrong, max: 13, color: 'bg-emerald-500' },
                                      { name: 'Biyoloji', c: ex.aytScores.biologyCorrect, w: ex.aytScores.biologyWrong, max: 13, color: 'bg-rose-500' }
                                    ].map(sub => {
                                      const net = Number((sub.c - sub.w * 0.25).toFixed(2));
                                      const pct = sub.max > 0 ? Math.max(0, Math.round((net / sub.max) * 100)) : 0;
                                      if (sub.c === 0 && sub.w === 0) return null; // hide unused fields in AYT track
                                      return (
                                        <tr key={sub.name} className="border-b dark:border-zinc-800 last:border-0 hover:bg-zinc-50/20 dark:hover:bg-zinc-955/10">
                                          <td className="p-3 font-bold dark:text-zinc-200">{sub.name}</td>
                                          <td className="p-3 text-center text-green-600 font-bold">{sub.c}</td>
                                          <td className="p-3 text-center text-red-500 font-bold">{sub.w}</td>
                                          <td className="p-3 text-center font-black dark:text-white font-mono">{net}</td>
                                          <td className="p-3 hidden sm:table-cell">
                                            <div className="flex items-center gap-3">
                                              <div className="h-2 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                                                <div className={`h-full ${sub.color}`} style={{ width: `${pct}%` }} />
                                              </div>
                                              <span className="text-[10px] font-mono text-zinc-400 font-bold">% {pct}</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Notes if present */}
                          {ex.notes && (
                            <div className="p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 select-text">
                              💡 <b>Sınav Notları:</b> {ex.notes}
                            </div>
                          )}

                          {/* Mistake Questions from this exam list */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black text-zinc-450 uppercase tracking-wider block">Bu sınavla ilişkili yanlışların</span>
                              
                              <button
                                onClick={() => handleAddQuestionFromExamClick(ex)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-all shadow-sm"
                              >
                                ✍️ Deftere Yanlış Ekle
                              </button>
                            </div>

                            {examMistakes.length === 0 ? (
                              <p className="text-[11px] text-zinc-500 italic">Henüz bu sınavdan yanlış soru kaydedilmemiş.</p>
                            ) : (
                              <div className="grid gap-2">
                                {examMistakes.map(q => (
                                  <div
                                    key={q.id}
                                    onClick={() => setSelectedQuestion(q)}
                                    className="p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 hover:border-blue-500 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:shadow-sm"
                                  >
                                    <span className="font-bold dark:text-zinc-200 line-clamp-1 flex-1 pr-4">{q.questionText}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold shrink-0 border ${
                                      q.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                                    }`}>
                                      {q.status === 'resolved' ? 'Anlaşıldı' : 'Çözülecek'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete Exam Action */}
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => handleDeleteExam(ex.id)}
                              className="px-3 py-1.5 text-[10px] text-red-500 border border-red-200 dark:border-red-900/50 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              Denemeyi Sil
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL: YANLIŞ SORU EKLEME / DÜZENLEME ── */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/30 border-b dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-sm dark:text-white flex items-center gap-1.5">
                <span>✍️</span> {qEditId ? 'Soru Düzenle' : 'Yanlış Soru Ekle'}
              </h3>
              <button
                onClick={() => { setIsQuestionModalOpen(false); resetQuestionForm(); }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 max-h-[500px] overflow-y-auto select-text">
              
              {/* Subject & Topic Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Ders Seçimi</label>
                  <select
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
                    required
                  >
                    {Object.entries(subjectMeta).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Konu Başlığı</label>
                  <input
                    type="text"
                    placeholder="Örn: Limit, Logaritma"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                </div>
              </div>

              {/* Question Image Upload / URL Selector */}
              <div className="space-y-2 border dark:border-zinc-800 p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex justify-between items-center select-none mb-1">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Soru Görseli (İsteğe Bağlı)</label>
                  
                  <div className="flex gap-2 text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`px-2 py-1 rounded transition-colors ${
                        uploadMode === 'file'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200'
                      }`}
                    >
                      Dosya Yükle
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`px-2 py-1 rounded transition-colors ${
                        uploadMode === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200'
                      }`}
                    >
                      Resim URL'si
                    </button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div className="space-y-2">
                    <div className="relative border-2 border-dashed border-zinc-250 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 transition-colors hover:border-blue-500/50">
                      {qImagePreview ? (
                        <div className="relative w-full max-h-36 rounded-lg overflow-hidden flex items-center justify-center">
                          <img src={qImagePreview} alt="Önizleme" className="object-contain max-h-36 rounded" />
                          <button
                            type="button"
                            onClick={() => {
                              setQImageFile(null);
                              setQImagePreview(null);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-zinc-400 mb-1.5 animate-pulse">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <span className="text-[10px] text-zinc-500 font-bold mb-1 text-center">Görsel seçin veya sürükleyin</span>
                          <span className="text-[8px] text-zinc-400 font-medium">PNG, JPG, WEBP (Maks. 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Dosya boyutu 5MB\'tan küçük olmalıdır.');
                                  return;
                                }
                                setQImageFile(file);
                                setQImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/question-image.jpg"
                      value={qImageUrl}
                      onChange={(e) => {
                        setQImageUrl(e.target.value);
                        setQImagePreview(e.target.value || null);
                      }}
                      className="w-full p-2.5 text-xs bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-medium"
                    />
                    {qImagePreview && (
                      <div className="relative w-full max-h-36 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-900 border dark:border-zinc-850 p-2 mt-1">
                        <img src={qImagePreview} alt="Önizleme" className="object-contain max-h-32 rounded" />
                      </div>
                    )}
                  </div>
                )}
                {imageUploading && (
                  <div className="text-[10px] text-blue-500 font-extrabold flex items-center gap-1.5 select-none animate-pulse">
                    <span>⏳ Resim yükleniyor, lütfen bekleyin...</span>
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase">Soru Metni</label>
                <textarea
                  rows={3}
                  placeholder="Sorunun metnini yazın (görsel varsa isteğe bağlı)..."
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed"
                  required={!qImageUrl && !qImagePreview}
                />
              </div>

              {/* Correct & User answers optional inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Doğru Cevap</label>
                  <input
                    type="text"
                    placeholder="C / 24 / vb."
                    value={qCorrect}
                    onChange={e => setQCorrect(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase">Benim Cevabım</label>
                  <input
                    type="text"
                    placeholder="A / 12 / vb."
                    value={qUserAnswer}
                    onChange={e => setQUserAnswer(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                </div>
              </div>

              {/* Solution/Explanation text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase">Çözüm / Formül / Unuttuğun Ayrıntı</label>
                <textarea
                  rows={3}
                  placeholder="Soruyu öğrenirken çıkardığın çözüm notlarını veya unuttuğun kuralı yaz..."
                  value={qSolution}
                  onChange={e => setQSolution(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed"
                />
              </div>

              {/* Link practice exam option */}
              {practiceExams.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase">İlişkili Deneme Sınavı</label>
                  <select
                    value={qExamId}
                    onChange={e => setQExamId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Herhangi bir denemeyle ilişkilendirme</option>
                    {practiceExams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.title} ({ex.type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  {qEditId ? 'Değişiklikleri Kaydet ✓' : 'Soru Defterine Ekle ✓'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAYLI SORU GÖRÜNTÜLEME ── */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/30 border-b dark:border-zinc-800 flex justify-between items-center">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                (subjectMeta[selectedQuestion.subject] || subjectMeta['diğer']).bg
              } ${(subjectMeta[selectedQuestion.subject] || subjectMeta['diğer']).color} ${(subjectMeta[selectedQuestion.subject] || subjectMeta['diğer']).border} border`}>
                {(subjectMeta[selectedQuestion.subject] || subjectMeta['diğer']).icon} {(subjectMeta[selectedQuestion.subject] || subjectMeta['diğer']).label}
              </span>
              
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto select-text">
              
              {/* Question Text section */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Soru İçeriği</h4>
                {selectedQuestion.topic && (
                  <p className="text-[11px] font-bold text-zinc-550 dark:text-zinc-400">Konu: {selectedQuestion.topic}</p>
                )}
                {selectedQuestion.imageUrl && (
                  <div className="relative w-full rounded-2xl overflow-hidden border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shadow-sm max-h-[300px] flex items-center justify-center mb-3">
                    <img src={selectedQuestion.imageUrl} alt="Soru Görseli" className="object-contain max-h-[300px] w-full" />
                  </div>
                )}
                {selectedQuestion.questionText && (
                  <p className="text-sm leading-relaxed dark:text-zinc-100 font-medium whitespace-pre-wrap p-4 bg-zinc-50/50 dark:bg-zinc-955/30 border dark:border-zinc-800 rounded-2xl text-justify">
                    {selectedQuestion.questionText}
                  </p>
                )}
              </div>

              {/* Answers details */}
              {(selectedQuestion.correctAnswer || selectedQuestion.userAnswer) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedQuestion.correctAnswer && (
                    <div className="p-3 bg-green-50/40 dark:bg-green-955/10 border border-green-200/50 dark:border-green-900/30 rounded-xl">
                      <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider block">Doğru Cevap</span>
                      <span className="text-sm font-black text-green-600 dark:text-green-400 mt-0.5 block">{selectedQuestion.correctAnswer}</span>
                    </div>
                  )}
                  {selectedQuestion.userAnswer && (
                    <div className="p-3 bg-red-50/40 dark:bg-red-955/10 border border-red-200/50 dark:border-red-900/30 rounded-xl">
                      <span className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider block">Benim Cevabım</span>
                      <span className="text-sm font-black text-red-500 dark:text-red-400 mt-0.5 block">{selectedQuestion.userAnswer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Solution/Explanation text */}
              {selectedQuestion.solutionText && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Çözüm Tüyoları & Çıkarılan Dersler</h4>
                  <div className="p-4 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-200/30 dark:border-amber-900/20 rounded-2xl text-xs leading-relaxed text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap font-medium">
                    {selectedQuestion.solutionText}
                  </div>
                </div>
              )}

              {/* Linking details info */}
              <div className="text-[10px] font-bold text-zinc-500 flex justify-between items-center py-2 border-t dark:border-zinc-800">
                <span>Eklendiği Tarih: {new Date(selectedQuestion.createdAt).toLocaleDateString('tr-TR')}</span>
                <span>Durum: {selectedQuestion.status === 'resolved' ? '✓ Anlaşıldı' : '⏳ Çözülecek'}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 select-none">
                <button
                  onClick={() => handleToggleQuestionStatus(selectedQuestion.id)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    selectedQuestion.status === 'resolved'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30'
                      : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-955/20 dark:text-green-400 dark:border-green-900/30'
                  }`}
                >
                  {selectedQuestion.status === 'resolved' ? '⏳ Tekrar Çözüm Listesine Al' : '✓ Anlaşıldı Olarak İşaretle'}
                </button>
                
                <button
                  onClick={() => handleEditQuestionClick(selectedQuestion)}
                  className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Düzenle"
                >
                  Düzenle
                </button>

                <button
                  onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                  className="px-4 py-3 text-red-500 border border-red-200 dark:border-red-900/50 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/15 rounded-xl font-bold transition-all cursor-pointer"
                  title="Sil"
                >
                  Sil
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: YENİ DENEME EKLEME ── */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp">
            
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/30 border-b dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-sm dark:text-white flex items-center gap-1.5">
                <span>📈</span> Yeni Deneme Sınavı Ekle
              </h3>
              <button
                onClick={() => { setIsExamModalOpen(false); resetExamForm(); }}
                className="text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-350 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4 max-h-[500px] overflow-y-auto select-text">
              
              {/* Type Select & Date Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-405 uppercase">Sınav Türü</label>
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl flex gap-1 font-bold text-xs select-none">
                    {(['TYT', 'AYT'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExamType(type)}
                        className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                          examType === type
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-450 uppercase">Tarih</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Title & Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase">Sınav / Yayın Adı</label>
                <input
                  type="text"
                  placeholder="Örn: 3D Türkiye Geneli TYT-1"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-bold"
                  required
                />
              </div>

              {/* Breakdown inputs based on TYT or AYT selection */}
              {examType === 'TYT' ? (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b dark:border-zinc-800 pb-1">Ders Net Girişleri (TYT)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Türkçe (40 Soru)', c: tytTrC, setC: setTytTrC, w: tytTrW, setW: setTytTrW },
                      { label: 'Sosyal Bilimler (20 Soru)', c: tytSocC, setC: setTytSocC, w: tytSocW, setW: setTytSocW },
                      { label: 'Matematik (40 Soru)', c: tytMatC, setC: setTytMatC, w: tytMatW, setW: setTytMatW },
                      { label: 'Fen Bilimleri (20 Soru)', c: tytSciC, setC: setTytSciC, w: tytSciW, setW: setTytSciW }
                    ].map(field => (
                      <div key={field.label} className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border dark:border-zinc-850 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{field.label}</span>
                        <div className="flex gap-2 items-center font-mono">
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={field.c}
                            onChange={e => field.setC(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-10 p-1 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-xs font-bold rounded animate-none"
                            title="Doğru Sayısı"
                          />
                          <span className="text-[10px] text-green-600 font-bold">D</span>
                          
                          <input
                            type="number"
                            min={0}
                            max={40}
                            value={field.w}
                            onChange={e => field.setW(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-10 p-1 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-xs font-bold rounded"
                            title="Yanlış Sayısı"
                          />
                          <span className="text-[10px] text-red-500 font-bold">Y</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TYT Net preview */}
                  <div className="bg-blue-50/40 dark:bg-blue-955/15 border border-blue-200/50 dark:border-blue-900/30 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>Toplam TYT Neti:</span>
                    <span className="text-base font-black font-mono">
                      {Number((tytTrC + tytSocC + tytMatC + tytSciC - (tytTrW + tytSocW + tytMatW + tytSciW) * 0.25).toFixed(2))} / 120
                    </span>
                  </div>

                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b dark:border-zinc-800 pb-1">Ders Net Girişleri (AYT)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {[
                      { label: 'Matematik (40 Soru)', c: aytMatC, setC: setAytMatC, w: aytMatW, setW: setAytMatW },
                      { label: 'Edebiyat (24 Soru)', c: aytLitC, setC: setAytLitC, w: aytLitW, setW: setAytLitW },
                      { label: 'Tarih 1 (10 Soru)', c: aytHist1C, setC: setAytHist1C, w: aytHist1W, setW: setAytHist1W },
                      { label: 'Coğrafya 1 (6 Soru)', c: aytGeo1C, setC: setAytGeo1C, w: aytGeo1W, setW: setAytGeo1W },
                      { label: 'Tarih 2 (11 Soru)', c: aytHist2C, setC: setAytHist2C, w: aytHist2W, setW: setAytHist2W },
                      { label: 'Coğrafya 2 (11 Soru)', c: aytGeo2C, setC: setAytGeo2C, w: aytGeo2W, setW: setAytGeo2W },
                      { label: 'Felsefe (12 Soru)', c: aytPhilC, setC: setAytPhilC, w: aytPhilW, setW: setAytPhilW },
                      { label: 'Din Kültürü (6 Soru)', c: aytRelC, setC: setAytRelC, w: aytRelW, setW: setAytRelW },
                      { label: 'Fizik (14 Soru)', c: aytPhysC, setC: setAytPhysC, w: aytPhysW, setW: setAytPhysW },
                      { label: 'Kimya (13 Soru)', c: aytChemC, setC: setAytChemC, w: aytChemW, setW: setAytChemW },
                      { label: 'Biyoloji (13 Soru)', c: aytBioC, setC: setAytBioC, w: aytBioW, setW: setAytBioW }
                    ].map(field => (
                      <div key={field.label} className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border dark:border-zinc-850 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">{field.label}</span>
                        <div className="flex gap-2 items-center font-mono shrink-0">
                          <input
                            type="number"
                            min={0}
                            value={field.c}
                            onChange={e => field.setC(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-10 p-1 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-xs font-bold rounded"
                          />
                          <span className="text-[10px] text-green-600 font-bold">D</span>
                          
                          <input
                            type="number"
                            min={0}
                            value={field.w}
                            onChange={e => field.setW(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-10 p-1 text-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-xs font-bold rounded"
                          />
                          <span className="text-[10px] text-red-500 font-bold">Y</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AYT Net preview */}
                  <div className="bg-purple-50/40 dark:bg-purple-955/15 border border-purple-200/50 dark:border-purple-900/30 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-purple-650 dark:text-purple-400">
                    <span>Toplam AYT Neti:</span>
                    <span className="text-base font-black font-mono">
                      {Number((aytMatC+aytLitC+aytHist1C+aytGeo1C+aytHist2C+aytGeo2C+aytPhilC+aytRelC+aytPhysC+aytChemC+aytBioC - (aytMatW+aytLitW+aytHist1W+aytGeo1W+aytHist2W+aytGeo2W+aytPhilW+aytRelW+aytPhysW+aytChemW+aytBioW) * 0.25).toFixed(2))} / 80
                    </span>
                  </div>

                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 uppercase">Genel Değerlendirme / Hedefler</label>
                <textarea
                  rows={2}
                  placeholder="Denemeye dair notlar (Zaman kontrolü nasıldı? Hangi konularda eksiklik hissettin?)"
                  value={examNotes}
                  onChange={e => setExamNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-xl border dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Deneme Kaydını Tamamla ✓
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: YANLIŞ SORU PRATİK MODU ── */}
      {randomQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp">
            
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/30 border-b dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-sm dark:text-white flex items-center gap-1.5">
                <span>🎯</span> Yanlış Soru Pratik Modu
              </h3>
              <button
                onClick={() => setRandomQuestion(null)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[485px] overflow-y-auto select-text">
              
              {/* Subject metadata badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  (subjectMeta[randomQuestion.subject] || subjectMeta['diğer']).bg
                } ${(subjectMeta[randomQuestion.subject] || subjectMeta['diğer']).color} border ${(subjectMeta[randomQuestion.subject] || subjectMeta['diğer']).border}`}>
                  {(subjectMeta[randomQuestion.subject] || subjectMeta['diğer']).icon} {(subjectMeta[randomQuestion.subject] || subjectMeta['diğer']).label}
                </span>
                {randomQuestion.topic && (
                  <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Konu: {randomQuestion.topic}</span>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <h4 className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Soru</h4>
                {randomQuestion.imageUrl && (
                  <div className="relative w-full rounded-2xl overflow-hidden border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shadow-sm max-h-[300px] flex items-center justify-center mb-3">
                    <img src={randomQuestion.imageUrl} alt="Soru Görseli" className="object-contain max-h-[300px] w-full" />
                  </div>
                )}
                {randomQuestion.questionText && (
                  <p className="text-sm leading-relaxed dark:text-zinc-100 font-medium whitespace-pre-wrap p-5 bg-zinc-50/50 dark:bg-zinc-955/30 border dark:border-zinc-800 rounded-2xl text-justify">
                    {randomQuestion.questionText}
                  </p>
                )}
              </div>

              {/* Reveal toggle or answers */}
              {!randomAnswerRevealed ? (
                <button
                  onClick={() => setRandomAnswerRevealed(true)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-xs transition-all shadow-md cursor-pointer text-center"
                >
                  Çözümü ve Doğru Cevabı Göster 👁️
                </button>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Answers details */}
                  {(randomQuestion.correctAnswer || randomQuestion.userAnswer) && (
                    <div className="grid grid-cols-2 gap-4">
                      {randomQuestion.correctAnswer && (
                        <div className="p-3 bg-green-50/40 dark:bg-green-955/10 border border-green-200/50 dark:border-green-900/30 rounded-xl">
                          <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-wider block">Doğru Cevap</span>
                          <span className="text-sm font-black text-green-600 dark:text-green-400 mt-0.5 block">{randomQuestion.correctAnswer}</span>
                        </div>
                      )}
                      {randomQuestion.userAnswer && (
                        <div className="p-3 bg-red-50/40 dark:bg-red-955/10 border border-red-200/50 dark:border-red-900/30 rounded-xl">
                          <span className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider block">Denemede Verdiğin Cevap</span>
                          <span className="text-sm font-black text-red-500 dark:text-red-400 mt-0.5 block">{randomQuestion.userAnswer}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Solution / notes text */}
                  {randomQuestion.solutionText ? (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Çözüm Notları</h4>
                      <div className="p-4 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-250/20 dark:border-amber-900/20 rounded-xl text-xs leading-relaxed text-zinc-805 dark:text-zinc-300 whitespace-pre-wrap font-medium">
                        {randomQuestion.solutionText}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic leading-relaxed">Çözüm notu eklenmemiş.</p>
                  )}

                  <div className="flex gap-2 pt-2 select-none">
                    <button
                      onClick={() => {
                        handleToggleQuestionStatus(randomQuestion.id);
                        setRandomQuestion(null);
                      }}
                      className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer text-center shadow-sm"
                    >
                      ✓ Artık Anladım, Listeden Çıkar
                    </button>
                    
                    <button
                      onClick={startRandomPractice}
                      className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Başka Soru Getir 🎲
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
