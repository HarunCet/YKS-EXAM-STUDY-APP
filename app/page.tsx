import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import RecentProgress from './components/RecentProgress';
import HeaderMenu from './components/HeaderMenu';
import GoalsAndPlans from './components/GoalsAndPlans';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const tasks = user?.user_metadata?.tasks || [];
  const subjectNotes = user?.user_metadata?.subject_notes || {};
  const isGuest = !user;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <HeaderMenu />
          <h1 className="text-xl font-bold">YKS Ders Çalışma</h1>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 hidden md:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors border border-red-100/50 dark:border-red-950/50 cursor-pointer">
                Çıkış Yap
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400 hidden md:inline">Misafir Kullanıcı</span>
            <Link href="/login" className="text-sm px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm cursor-pointer">
              Giriş Yap / Üye Ol
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Haftalık Hedefler & Notlar */}
        <GoalsAndPlans initialTasks={tasks} initialSubjectNotes={subjectNotes} isGuest={isGuest} />

        <RecentProgress />
        
        {/* YKS Bilgi Düellosu Banner */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-650 to-rose-600 p-0.5 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
          <div className="bg-zinc-950/90 dark:bg-zinc-950/90 rounded-[15px] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-3">
                ✨ Yeni Özellik
              </span>
              <h3 className="text-2xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                <span>⚔️</span> YKS Bilgi Düellosu {isGuest && <span className="text-xs">🔒</span>}
              </h3>
              <p className="text-zinc-300 text-sm mt-2 max-w-xl">
                YKS Fizik, Kimya, Biyoloji ve Türkçe Dil Bilgisi derslerinden en önemli hap bilgilerle donatılmış sorularla yarış! İster yanındaki arkadaşınla aynı klavyede düello yap, ister YKS yapay zeka botuna meydan oku.
              </p>
            </div>
            {isGuest ? (
              <Link 
                href="/login" 
                className="px-6 py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-650 hover:to-zinc-750 text-white font-extrabold rounded-xl text-sm tracking-wide shadow-md active:scale-95 transition-all w-full md:w-auto text-center cursor-pointer uppercase shrink-0"
              >
                Giriş Yap ve Yarış 🔒
              </Link>
            ) : (
              <Link 
                href="/yarisma" 
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-rose-500 hover:from-blue-450 hover:to-rose-450 text-white font-extrabold rounded-xl text-sm tracking-wide shadow-md active:scale-95 transition-all w-full md:w-auto text-center cursor-pointer uppercase shrink-0"
              >
                Kapışmayı Başlat →
              </Link>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-8 text-center sm:text-left flex items-center gap-2">
          <span>🧠</span> YKS Egzersiz Merkezi
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/exercises/maths" className="block group">
            <div className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform">
                  📐
                </div>
                <h3 className="font-bold mb-2 dark:text-white">Matematik Çözümleri</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Karalama defteri ve detaylı süre analizleri ile TYT matematik sorularını çözün.
                </p>
              </div>
              <span className="text-xs text-blue-500 dark:text-blue-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Başla →</span>
            </div>
          </Link>

          <Link href="/exercises/paragraphs" className="block group">
            <div className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-green-500 transition-all flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform">
                  📖
                </div>
                <h3 className="font-bold mb-2 dark:text-white">Hız Okuma & Paragraf</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Guided-reading hız modu ve kelime hatırlama skoru ile paragraf hızınızı katlayın.
                </p>
              </div>
              <span className="text-xs text-green-500 dark:text-green-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Başla →</span>
            </div>
          </Link>

          {isGuest ? (
            <Link href="/login" className="block group">
              <div className="h-full p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between opacity-80 group-hover:opacity-100">
                <div>
                  <div className="h-10 w-10 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform relative">
                    ⚡
                    <span className="absolute -top-1 -right-1 text-xs">🔒</span>
                  </div>
                  <h3 className="font-bold mb-2 dark:text-white">Pratik İşlem Sprinti</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                    60 saniyede TYT matematik işlem hızınızı sınayın. Hızlı işlem gücünüzü geliştirin.
                  </p>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Giriş Yap 🔒</span>
              </div>
            </Link>
          ) : (
            <Link href="/exercises/sprint" className="block group">
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <h3 className="font-bold mb-2 dark:text-white">Pratik İşlem Sprinti</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    60 saniyede TYT matematik işlem hızınızı sınayın. Hızlı işlem gücünüzü geliştirin.
                  </p>
                </div>
                <span className="text-xs text-amber-500 dark:text-amber-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Yarış →</span>
              </div>
            </Link>
          )}

          {isGuest ? (
            <Link href="/login" className="block group">
              <div className="h-full p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700 transition-all flex flex-col justify-between opacity-80 group-hover:opacity-100">
                <div>
                  <div className="h-10 w-10 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform relative">
                    🗂️
                    <span className="absolute -top-1 -right-1 text-xs">🔒</span>
                  </div>
                  <h3 className="font-bold mb-2 dark:text-white">YKS Bilgi Kartları</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                    Sayısal, sözel ve Türkçe dil bilgisi derslerinin en kritik formül ve kavram kartları.
                  </p>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Giriş Yap 🔒</span>
              </div>
            </Link>
          ) : (
            <Link href="/exercises/flashcards" className="block group">
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-purple-500 transition-all flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 rounded-xl flex items-center justify-center mb-5 text-xl group-hover:scale-110 transition-transform">
                    🗂️
                  </div>
                  <h3 className="font-bold mb-2 dark:text-white">YKS Bilgi Kartları</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Sayısal, sözel ve Türkçe dil bilgisi derslerinin en kritik formül ve kavram kartları.
                  </p>
                </div>
                <span className="text-xs text-purple-500 dark:text-purple-400 font-bold mt-4 block group-hover:translate-x-1 transition-transform">Ezberle →</span>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
