'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function YksSayacPage() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    totalHours: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  // Target date: YKS TYT starting on June 20, 2026 at 10:15 AM (UTC+3 for Turkey)
  const targetDate = new Date('2026-06-20T10:15:00+03:00').getTime();

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({
          totalHours: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOver: true,
        });
        return;
      }

      const seconds = Math.floor((difference / 1000) % 60);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const totalHours = Math.floor(difference / (1000 * 60 * 60));

      setTimeLeft({
        totalHours,
        days,
        hours,
        minutes,
        seconds,
        isOver: false,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black text-foreground">
      {/* Header */}
      <header className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">YKS Sayaç</h1>
        <Link
          href="/"
          className="text-sm px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          ← Ana Sayfaya Dön
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col justify-center items-center">
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-md w-full text-center">
          <div className="text-5xl md:text-6xl mb-6 select-none animate-pulse">⏱️</div>

          <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-zinc-900 dark:text-zinc-100">
            YKS 2026 Geri Sayım
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
            Sınav Tarihi: 20 Haziran 2026, Cumartesi (10:15)
          </p>

          {!mounted ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-3/4 mx-auto"></div>
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
              </div>
            </div>
          ) : timeLeft.isOver ? (
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900/50 mb-8 text-lg">
              🎉 YKS 2026 sınav süreci başladı veya tamamlandı! Başarılar dileriz!
            </div>
          ) : (
            <div className="space-y-8">
              {/* Highlighted Total Hours */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800/50 dark:to-zinc-900 p-6 md:p-8 rounded-2xl border border-amber-100 dark:border-zinc-800 inline-block w-full max-w-md">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Toplam Kalan Süre
                </span>
                <h3 className="text-4xl md:text-5xl font-black text-amber-700 dark:text-amber-400 mt-2 font-mono tabular-nums">
                  {timeLeft.totalHours.toLocaleString('tr-TR')}
                </h3>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1 block">
                  Saat Kaldı
                </span>
              </div>

              {/* Countdown Breakdown */}
              <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto">
                <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 p-3 md:p-4 rounded-xl">
                  <div className="text-2xl md:text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 font-mono tabular-nums">
                    {timeLeft.days}
                  </div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                    Gün
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 p-3 md:p-4 rounded-xl">
                  <div className="text-2xl md:text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 font-mono tabular-nums">
                    {timeLeft.hours}
                  </div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                    Saat
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 p-3 md:p-4 rounded-xl">
                  <div className="text-2xl md:text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 font-mono tabular-nums">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                    Dakika
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 p-3 md:p-4 rounded-xl">
                  <div className="text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums animate-pulse">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                    Saniye
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/"
              className="inline-flex justify-center w-full max-w-xs px-6 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold hover:opacity-90 transition-opacity cursor-pointer text-sm"
            >
              Çalışmaya Geri Dön
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
