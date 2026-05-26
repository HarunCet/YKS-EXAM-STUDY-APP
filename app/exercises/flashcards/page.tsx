'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Flashcard {
  id: string;
  category: 'matematik' | 'fizik' | 'kimya' | 'biyoloji' | 'dil_bilgisi';
  front: string; // Question or formula name
  back: string;  // The formula / rule / concept explanation
  hint?: string;
}

const flashcardsData: Flashcard[] = [
  // Matematik
  {
    id: 'm1',
    category: 'matematik',
    front: 'İkinci Dereceden Denklem Kökleri (Toplamı ve Çarpımı)',
    back: 'ax² + bx + c = 0 denkleminin kökleri x₁ ve x₂ olmak üzere:\n\n• Kökler Toplamı: x₁ + x₂ = -b/a\n• Kökler Çarpımı: x₁ . x₂ = c/a',
    hint: 'Katsayılar oranını düşünün.'
  },
  {
    id: 'm2',
    category: 'matematik',
    front: 'Logaritma Kuralları (Çarpım ve Bölüm)',
    back: '• log_a(x . y) = log_a(x) + log_a(y)\n• log_a(x / y) = log_a(x) - log_a(y)',
    hint: 'Üslü sayılarda çarpma tabanlar aynıyken üslerin toplanması prensibi.'
  },
  {
    id: 'm3',
    category: 'matematik',
    front: 'Trigonometrik Özdeşlikler (Temel)',
    back: 'Her x reel sayısı için:\n\n• sin²(x) + cos²(x) = 1\n• tan(x) . cot(x) = 1',
    hint: 'Birim çember üzerindeki Pisagor teoremini hatırlayın.'
  },
  {
    id: 'm4',
    category: 'matematik',
    front: 'Temel Türev Formülleri (ln(x) ve e^x)',
    back: '• d/dx (ln(x)) = 1/x\n• d/dx (e^x) = e^x',
    hint: 'Logaritmik ve doğal üslü fonksiyon türevi.'
  },
  {
    id: 'm5',
    category: 'matematik',
    front: 'Aritmetik Dizi Genel Terimi',
    back: 'İlk terimi a₁ ve ortak farkı d olan aritmetik dizide n. terim:\n\na_n = a₁ + (n - 1) . d',
    hint: 'Her adımda d kadar eklenerek gider.'
  },

  // Fizik
  {
    id: 'f1',
    category: 'fizik',
    front: 'Newton\'un II. Hareket Yasası (Dinamiğin Temel Prensibi)',
    back: 'Bir cisme etki eden net kuvvet, cismin kütlesi ile ivmesinin çarpımına eşittir:\n\nF_net = m . a\n\n(F: Newton, m: kg, a: m/s²)',
    hint: 'Kuvvet eşittir kütle çarpı ivme.'
  },
  {
    id: 'f2',
    category: 'fizik',
    front: 'Elektriksel Ohm Kanunu',
    back: 'Bir iletkenin uçları arasındaki potansiyel farkının (V) üzerinden geçen akım şiddetine (I) oranı sabittir ve bu iletkenin direncine (R) eşittir:\n\nV = I . R',
    hint: 'Akıllarda Vır diye tutulur.'
  },
  {
    id: 'f3',
    category: 'fizik',
    front: 'Mekanik Enerji Formülleri (Kinetik ve Potansiyel)',
    back: '• Kinetik Enerji: E_k = 1/2 . m . v²\n• Yerçekimi Potansiyel Enerjisi: E_p = m . g . h',
    hint: 'Hareket enerjisi ve yükseklik enerjisi.'
  },
  {
    id: 'f4',
    category: 'fizik',
    front: 'Dalga Hızı Formülü',
    back: 'Bir dalganın yayılma hızı (v), dalga boyu (λ) ve frekansının (f) çarpımına eşittir:\n\nv = λ . f   veya   v = λ / T  (T: Periyot)',
    hint: 'Hız eşittir dalga boyu bölü periyot.'
  },

  // Kimya
  {
    id: 'k1',
    category: 'kimya',
    front: 'İdeal Gaz Denklemi',
    back: 'P . V = n . R . T\n\n• P: Basınç (atm)\n• V: Hacim (Litre)\n• n: Mol sayısı\n• R: Gaz sabiti (0.0821 veya 22.4/273)\n• T: Sıcaklık (Kelvin)',
    hint: 'Paran Varsa Ne Rahat!'
  },
  {
    id: 'k2',
    category: 'kimya',
    front: 'Mol Sayısı Bulma Formülü',
    back: 'n = m / M_A\n\n• n: Mol sayısı\n• m: Maddenin kütlesi (gram)\n• M_A: Maddenin mol kütlesi (g/mol)',
    hint: 'Kütle bölü mol kütlesi.'
  },
  {
    id: 'k3',
    category: 'kimya',
    front: 'Kovalent ve İyonik Bağ Tanımı',
    back: '• İyonik Bağ: Metal ve ametal atomları arasında elektron alışverişi ile kurulur.\n• Kovalent Bağ: Ametal atomları arasında elektron ortaklaşa kullanımı ile kurulur.',
    hint: 'Elektron alışverişi mi, ortak kullanımı mı?'
  },

  // Biyoloji
  {
    id: 'b1',
    category: 'biyoloji',
    front: 'Fotosentez Genel Denklemi',
    back: 'Işık ve klorofil varlığında:\n\n6CO₂ + 6H₂O ---> C₆H₁₂O₆ (Glikoz) + 6O₂',
    hint: 'Karbondioksit ve su reaksiyona girer.'
  },
  {
    id: 'b2',
    category: 'biyoloji',
    front: 'Nükleotit Eşleşme Kuralları',
    back: '• DNA\'da: Adenin (A) ile Timin (T) ikili hidrojen bağıyla, Guanin (G) ile Sitozin (C) üçlü hidrojen bağıyla eşleşir.\n• RNA\'da: Timin yerine Urasil (U) bulunur (A-U eşleşmesi).',
    hint: 'At Galatasaray (A-T, G-C).'
  },
  {
    id: 'b3',
    category: 'biyoloji',
    front: 'Mitoz ve Mayoz Bölünme Farkları',
    back: '• Mitoz: Vücut hücrelerinde görülür, kromozom sayısı değişmez (2n->2n), kalıtsal çeşitlilik yoktur, 2 hücre oluşur.\n• Mayoz: Üreme ana hücrelerinde görülür, kromozom sayısı yarıya iner (2n->n), crossing-over ile çeşitlilik vardır, 4 hücre oluşur.',
    hint: 'Kromozom sayısı ve çeşitlilik durumuna bakın.'
  },

  // Türkçe Dil Bilgisi
  {
    id: 'd1',
    category: 'dil_bilgisi',
    front: 'Ünsüz Yumuşaması (Sert Sessiz Yumuşaması)',
    back: 'Sert ünsüzlerden (p, ç, t, k) biriyle biten bir sözcüğe ünlüyle başlayan bir ek getirildiğinde bu ünsüzler yumuşayarak "b, c, d, g/ğ" seslerine dönüşür.\n\nÖrnek: kitap-ı -> kitabı, ağaç-a -> ağaca',
    hint: 'PÇTK seslerinin BCGĞ seslerine dönüşmesi.'
  },
  {
    id: 'd2',
    category: 'dil_bilgisi',
    front: '"Ki" Bağlacı ve "-ki" Ekinin Ayrımı',
    back: '• Bağlaç olan "ki" ayrı yazılır. Çıkarıldığında cümle anlamı bozulmaz (Örn: Duydum ki unutmuşsun).\n• Sıfat yapan ve İlgi zamiri olan "-ki" ekleri bitişik yazılır (Örn: bendeki kalem, yarınki sınav). Pratik yol: Kelimeye "-ler" eki getirin, anlamlı oluyorsa bitişiktir (Örn: bendekiler -> anlamlı).',
    hint: '-ler/-lar ekleme pratik kuralını hatırlayın.'
  },
  {
    id: 'd3',
    category: 'dil_bilgisi',
    front: 'Ünlü Daralması',
    back: 'Türkçede "a, e" geniş ünlüleriyle biten fillere "-yor" eki getirildiğinde, fiil sonundaki geniş ünlü daralarak "ı, i, u, ü" seslerine dönüşür.\n\nÖrnek: başla-yor -> başlıyor, bekle-yor -> bekliyor.',
    hint: '-yor ekinin kendinden önceki a-e sesini ı-i-u-ü yapması.'
  }
];

const categoryMeta = {
  all: { label: 'Tüm Kartlar', icon: '🗂️', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
  matematik: { label: 'Matematik', icon: '📐', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' },
  fizik: { label: 'Fizik', icon: '⚛️', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' },
  kimya: { label: 'Kimya', icon: '🧪', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' },
  biyoloji: { label: 'Biyoloji', icon: '🧬', color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' },
  dil_bilgisi: { label: 'Türkçe', icon: '✍️', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' }
};

export default function FlashcardsPage() {
  const [selectedCat, setSelectedCat] = useState<'all' | 'matematik' | 'fizik' | 'kimya' | 'biyoloji' | 'dil_bilgisi'>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Stats
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

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

  // Filter cards
  const filteredCards = selectedCat === 'all'
    ? flashcardsData
    : flashcardsData.filter(c => c.category === selectedCat);

  const currentCard = filteredCards[cardIndex];

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata || {};
          const mastered = meta.flashcard_mastered || [];
          const review = meta.flashcard_review || [];
          setMasteredIds(mastered);
          setReviewIds(review);
        }
      } catch (e) {
        // Fallback local storage
        const mastered = JSON.parse(localStorage.getItem('flashcard_mastered') || '[]');
        const review = JSON.parse(localStorage.getItem('flashcard_review') || '[]');
        setMasteredIds(mastered);
        setReviewIds(review);
      }
    }
    loadStats();
  }, [supabase]);

  // Sync to database helper
  const syncToDb = async (nextMastered: string[], nextReview: string[]) => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentMeta = user.user_metadata || {};
        const currentStats = currentMeta.exercise_stats || {};

        await supabase.auth.updateUser({
          data: {
            ...currentMeta,
            flashcard_mastered: nextMastered,
            flashcard_review: nextReview,
            exercise_stats: {
              ...currentStats,
              flashcardsStudied: Array.from(new Set([...nextMastered, ...nextReview])).length
            }
          }
        });
      }
    } catch (e) {
      console.error('Flashcard progress could not be synced:', e);
    } finally {
      setSyncing(false);
    }
  };

  // Mark status
  const handleMark = (status: 'know' | 'review') => {
    if (!currentCard) return;
    const cardId = currentCard.id;

    let nextMastered = [...masteredIds];
    let nextReview = [...reviewIds];

    if (status === 'know') {
      if (!nextMastered.includes(cardId)) nextMastered.push(cardId);
      nextReview = nextReview.filter(id => id !== cardId);
    } else {
      if (!nextReview.includes(cardId)) nextReview.push(cardId);
      nextMastered = nextMastered.filter(id => id !== cardId);
    }

    setMasteredIds(nextMastered);
    setReviewIds(nextReview);
    localStorage.setItem('flashcard_mastered', JSON.stringify(nextMastered));
    localStorage.setItem('flashcard_review', JSON.stringify(nextReview));
    syncToDb(nextMastered, nextReview);

    // Go to next card automatically after a delay
    setTimeout(() => {
      handleNext();
    }, 200);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (cardIndex < filteredCards.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      // Loop back to start
      setCardIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
    } else {
      setCardIndex(filteredCards.length - 1);
    }
  };

  // Reset progress
  const handleResetProgress = () => {
    if (confirm('Tüm kart çalışma ilerlemenizi sıfırlamak istediğinize emin misiniz?')) {
      setMasteredIds([]);
      setReviewIds([]);
      localStorage.setItem('flashcard_mastered', '[]');
      localStorage.setItem('flashcard_review', '[]');
      syncToDb([], []);
      setCardIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const totalStudied = Array.from(new Set([...masteredIds, ...reviewIds])).length;
  const progressPercent = flashcardsData.length > 0 ? Math.round((totalStudied / flashcardsData.length) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/exercises"
            className="text-sm px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Egzersiz Merkezi</span>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <h1 className="text-lg font-extrabold flex items-center gap-2 dark:text-white">
            <span>🗂️</span> YKS Akıllı Bilgi Kartları
          </h1>
        </div>
        <button
          onClick={handleResetProgress}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 dark:border-red-950/40 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold transition-colors cursor-pointer"
        >
          İlerlemeyi Sıfırla
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
        
        {/* Left Section: Subject Select & Stats (col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Progress Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400">Genel Ezber Durumu</span>
            <h2 className="text-lg font-extrabold mt-1 dark:text-white">Kart İlerleme Oranı</h2>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-purple-600 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2 font-bold font-mono">
              <span>{totalStudied} / {flashcardsData.length} kart</span>
              <span>%{progressPercent}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t dark:border-zinc-850">
              <div className="text-center bg-zinc-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold">BİLİYORUM</span>
                <span className="text-lg font-black text-green-600 dark:text-green-400 font-mono mt-0.5 block">{masteredIds.length}</span>
              </div>
              <div className="text-center bg-zinc-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold">TEKRAR ET</span>
                <span className="text-lg font-black text-red-500 dark:text-red-400 font-mono mt-0.5 block">{reviewIds.length}</span>
              </div>
            </div>
          </div>

          {/* Categories select */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">DERS SEÇİMİ</h3>
            <div className="flex flex-col gap-2">
              {(Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>).map(cat => {
                const isActive = selectedCat === cat;
                const meta = categoryMeta[cat];
                const count = cat === 'all' 
                  ? flashcardsData.length 
                  : flashcardsData.filter(c => c.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCat(cat);
                      setCardIndex(0);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-purple-650 text-white border-purple-600 shadow-sm scale-102 font-black' 
                        : 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isActive ? 'bg-purple-800 text-purple-200' : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: The 3D Flip Card (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {currentCard ? (
            <div className="flex flex-col flex-1 gap-6">
              
              {/* Perspective Card Container */}
              <div 
                className="w-full min-h-[350px] relative select-none cursor-pointer [perspective:1000px] flex-1 flex"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Flipping Body */}
                <div className={`w-full h-full absolute transition-all duration-500 [transform-style:preserve-3d] flex ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}>
                  
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md flex flex-col justify-between [backface-visibility:hidden] z-20">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${categoryMeta[currentCard.category].color}`}>
                        {categoryMeta[currentCard.category].icon} {categoryMeta[currentCard.category].label}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold">
                        {cardIndex + 1} / {filteredCards.length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4">
                      <h3 className="text-xl sm:text-2xl font-black leading-snug dark:text-white max-w-lg">
                        {currentCard.front}
                      </h3>
                      <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold mt-4 animate-pulse">
                        Kartı çevirmek için tıkla 🔄
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t dark:border-zinc-850 pt-4">
                      <div className="flex items-center gap-1.5">
                        {masteredIds.includes(currentCard.id) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-600 dark:text-green-455 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full border border-green-200/50 dark:border-green-900/30">
                            ✓ Ezberlendi
                          </span>
                        )}
                        {reviewIds.includes(currentCard.id) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full border border-red-200/50 dark:border-red-900/30">
                            🔄 Tekrar Edilmeli
                          </span>
                        )}
                      </div>
                      
                      {currentCard.hint && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Don't flip card
                            setShowHint(!showHint);
                          }}
                          className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                        >
                          {showHint ? 'İpucunu Kapat' : 'İpucu Göster'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute inset-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] z-10">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${categoryMeta[currentCard.category].color}`}>
                        Cevap & Açıklama
                      </span>
                      <span className="text-xs text-zinc-450 font-mono font-bold">
                        {cardIndex + 1} / {filteredCards.length}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4">
                      <div className="text-base sm:text-lg font-bold leading-relaxed whitespace-pre-wrap dark:text-zinc-100 font-mono text-zinc-800">
                        {currentCard.back}
                      </div>
                    </div>

                    <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 border-t dark:border-zinc-850 pt-4 animate-pulse">
                      Kartı çevirmek için tıkla 🔄
                    </div>
                  </div>

                </div>
              </div>

              {/* Show Hint area */}
              {showHint && currentCard.hint && !isFlipped && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium leading-relaxed animate-fadeIn">
                  💡 <b>İpucu:</b> {currentCard.hint}
                </div>
              )}

              {/* Self-evaluation & Navigation buttons */}
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={handlePrev}
                    className="p-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border dark:border-zinc-750 cursor-pointer shadow-sm"
                    title="Önceki Kart"
                  >
                    ←
                  </button>

                  {/* Evaluate buttons (shown especially when flipped, but usable anytime) */}
                  <div className="flex-1 flex gap-3">
                    <button
                      onClick={() => handleMark('review')}
                      className="flex-1 py-3.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 border border-red-100/50 dark:border-red-900/20 rounded-2xl text-xs font-black transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>Tekrar Edeceğim</span>
                    </button>
                    <button
                      onClick={() => handleMark('know')}
                      className="flex-1 py-3.5 px-4 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 dark:hover:bg-green-950/30 border border-green-100/50 dark:border-green-900/20 rounded-2xl text-xs font-black transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Biliyorum</span>
                    </button>
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border dark:border-zinc-750 cursor-pointer shadow-sm"
                    title="Sonraki Kart"
                  >
                    →
                  </button>
                </div>

                <div className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {syncing ? '💡 Veriler Supabase ile senkronize ediliyor...' : '💡 İşaretlediğin kartlar otomatik kaydedilir.'}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-zinc-450 dark:text-zinc-500 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-8 flex-1">
              <span className="text-5xl mb-4">🗂️</span>
              <p className="font-extrabold text-sm">Bu derste henüz eklenmiş bilgi kartı bulunmuyor.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
