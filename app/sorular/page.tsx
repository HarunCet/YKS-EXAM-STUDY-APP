import Link from 'next/link';

export default function SorularPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">YKS Soru Takip</h1>
        <Link
          href="/"
          className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          ← Ana Sayfaya Dön
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col justify-center items-center text-center">
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-sm max-w-lg w-full">
          <div className="text-6xl mb-6 select-none animate-bounce">✏️</div>
          
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Soru Takip Havuzu
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
            Burada günlük çözdüğünüz soru sayılarını kaydedebilecek, haftalık/aylık grafiklerle hedeflerinizi izleyebileceksiniz. Çok yakında hizmetinizde!
          </p>

          {/* Empty state details */}
          <div className="space-y-3 text-left mb-8 border-t border-b border-zinc-100 dark:border-zinc-800 py-6">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Günlük çözülen soru sayacı ve hedef belirleme</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Yanlış/Boş bırakılan soruları arşivleme ve tekrar çözme</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Çözüm süreleri ve ders bazlı verimlilik analizleri</span>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex justify-center w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            Ana Sayfaya Git
          </Link>
        </div>
      </main>
    </div>
  );
}
