'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on click outside drawer content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-blue-100 dark:border-zinc-700 cursor-pointer text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span>Menü</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        >
          {/* Drawer Container */}
          <div
            ref={drawerRef}
            className="w-80 h-full bg-white dark:bg-zinc-900 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 animate-slideInLeft"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                Uygulama Menüsü
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Content / Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Egzersizler Link */}
              <Link
                href="/exercises"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 hover:border-sky-200 dark:hover:border-sky-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  🧠
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Egzersiz Merkezi
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    İşlem sprinti, hız okuma ve akıllı kartlar
                  </p>
                </div>
              </Link>

              {/* Konular Link */}
              <Link
                href="/konular"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  📚
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Konular
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Derslere göre sınav müfredatı
                  </p>
                </div>
              </Link>

              {/* Çalışma Paneli Link */}
              <Link
                href="/calisma-paneli"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 hover:border-violet-200 dark:hover:border-violet-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-violet-100 dark:bg-violet-900/30 text-violet-650 dark:text-violet-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  📋
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-violet-650 dark:group-hover:text-violet-400 transition-colors">
                    Çalışma Paneli
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Haftalık görevler ve ders notları
                  </p>
                </div>
              </Link>

              {/* Sorular Link */}
              <Link
                href="/sorular"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Sorular
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Çözülen soruların takibi
                  </p>
                </div>
              </Link>

              {/* YKS Kaç Saat Kaldı Link */}
              <Link
                href="/yks-kac-saat-kaldi"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  ⏱️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    YKS Geri Sayım
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Sınava kalan canlı süre
                  </p>
                </div>
              </Link>

              {/* Sayısal Fen Düellosu Link */}
              <Link
                href="/yarisma"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                  ⚔️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    YKS Düellosu
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Hap bilgilerle 1v1 veya bota karşı yarış
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 block">
                Hedeflerine ulaşmak için her gün çalışmaya devam et!
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
