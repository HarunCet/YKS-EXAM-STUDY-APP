'use client';

import Link from 'next/link';

interface ExerciseStats {
  mathsSolved: number;
  mathsAccuracy: number;
  paragraphsRead: number;
  paragraphsAvgWpm: number;
  sprintHighscore: number;
  flashcardsStudied: number;
}

interface ExercisesClientProps {
  userEmail: string;
  initialStats: ExerciseStats;
}

export default function ExercisesClient({ userEmail, initialStats }: ExercisesClientProps) {
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
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <span>🧠</span> YKS Egzersiz Merkezi
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono hidden md:inline-block bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border dark:border-zinc-800">
            👤 {userEmail}
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8 animate-fadeIn">
        {/* Banner Intro */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-500 via-indigo-650 to-emerald-500 p-0.5 shadow-md">
          <div className="bg-zinc-950/90 dark:bg-zinc-950/90 rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
                🎯 TYT & AYT Performans Artırıcı
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Zihinsel Hız ve Pratiklik Antrenmanı</h2>
              <p className="text-zinc-300 text-sm max-w-2xl leading-relaxed">
                YKS sınavında başarı sadece bilgiyle değil, süre yönetimi ve pratiklikle gelir. İşlem hızını artıracak, okuma odaklanmanı güçlendirecek ve formülleri aklında tutmanı sağlayacak özel modülleri her gün düzenli olarak çöz.
              </p>
            </div>
            <div className="h-24 w-24 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner animate-pulse">
              ⚡
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider block">Matematik Çözümleri</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{initialStats.mathsSolved || 0}</span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">soru</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Ort. Başarı: %{initialStats.mathsAccuracy || 0}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider block">Paragraf Okuma</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-green-600 dark:text-green-400">{initialStats.paragraphsRead || 0}</span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">paragraf</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Ort. Hız: {initialStats.paragraphsAvgWpm || 0} WPM</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider block">İşlem Hızı Rekoru</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{initialStats.sprintHighscore || 0}</span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">skor</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">60sn pratik işlem rekoru</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider block">Çalışılan Formüller</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{initialStats.flashcardsStudied || 0}</span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">kart</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Aktif recall ezber takibi</div>
          </div>
        </div>

        {/* Modules List */}
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
            <span>🚀</span> Antrenman Modülleri
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Maths Problem Solving */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-500 transition-colors group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl">
                    📐
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    10'lu Soru Setleri
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Matematik Çözüm Egzersizleri</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    YKS TYT problem ağırlıklı matematik soru setlerini çözün. Kağıt kalem ihtiyacını ortadan kaldıran <b>Karalama Defteri</b> ve hangi soruda ne kadar süre harcadığınızı gösteren <b>Süre Analizi</b> özellikleri eklenmiştir.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-450 dark:text-zinc-500">Süre: 11 Dakika</span>
                <Link
                  href="/exercises/maths"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Çözmeye Başla →
                </Link>
              </div>
            </div>

            {/* Paragraph Speed Reading */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-green-500 transition-colors group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 rounded-2xl flex items-center justify-center text-2xl">
                    📖
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold">
                    Hız & Odaklanma
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Hız Okuma & Paragraf Egzersizleri</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Paragraf okuma hızınızı ve dikkatinizi geliştirin. Kelimelerin otomatik vurgulandığı <b>Göz Odak Hız Modu</b> ve yazdığınız özetin başarısını değerlendiren akıllı <b>Hatırlama Skoru (Keyword Matching)</b> özellikleri eklenmiştir.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-450 dark:text-zinc-500">Özel Hız Modu</span>
                <Link
                  href="/exercises/paragraphs"
                  className="px-4 py-2 bg-green-650 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Okumaya Başla →
                </Link>
              </div>
            </div>

            {/* Speed Calculation Sprint */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-colors group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 rounded-2xl flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    Pratik Hesaplama
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Pratik İşlem Sprinti</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    TYT Matematikte soru çözerken basit işlemlerde vakit mi kaybediyorsunuz? 60 saniyelik pratik işlem yarışmasıyla zihinden toplama, çıkarma, çarpma, bölme, üs alma ve kök tahmini becerinizi sınırlarına zorlayın.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-450 dark:text-zinc-500">Süre: 60 Saniye</span>
                <Link
                  href="/exercises/sprint"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Sprinti Başlat →
                </Link>
              </div>
            </div>

            {/* Spaced-Repetition Formula Flashcards */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-purple-500 transition-colors group">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 rounded-2xl flex items-center justify-center text-2xl">
                    🗂️
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-purple-650 dark:text-purple-400 text-[10px] font-bold">
                    Aktif Hatırlama
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold dark:text-white group-hover:text-purple-650 dark:group-hover:text-purple-400 transition-colors">YKS Akıllı Bilgi Kartları</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Matematik, Fizik, Kimya, Biyoloji ve Türkçe Dil Bilgisi derslerinin en kritik formül, kural ve hap bilgilerini aktif hatırlama yöntemiyle çalışın. Kendinizi puanlayın ve ezber durumunuzu takip edin.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-450 dark:text-zinc-500">Tüm Branşlar</span>
                <Link
                  href="/exercises/flashcards"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Kartları Çalış →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
