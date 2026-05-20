'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ProgressData {
  type: 'maths' | 'paragraphs';
  title: string;
  questionNumber: number;
  url: string;
  timestamp: number;
}

export default function RecentProgress() {
  const [progressList, setProgressList] = useState<ProgressData[]>([]);

  useEffect(() => {
    const list: ProgressData[] = [];
    
    const mathsRaw = localStorage.getItem('lastMathsQuestion');
    if (mathsRaw) {
      try {
        const data = JSON.parse(mathsRaw);
        list.push({
          type: 'maths',
          title: 'Matematik Egzersizleri',
          questionNumber: data.questionNumber,
          url: `/exercises/maths?set=${data.set}&index=${data.index}`,
          timestamp: data.timestamp || 0
        });
      } catch (e) {}
    }

    const parRaw = localStorage.getItem('lastParagraphsQuestion');
    if (parRaw) {
      try {
        const data = JSON.parse(parRaw);
        const params = new URLSearchParams();
        params.set('index', String(data.index ?? 0));
        if (data.showResults) params.set('showResults', 'true');

        list.push({
          type: 'paragraphs',
          title: 'Paragraf Egzersizleri',
          questionNumber: data.questionNumber,
          url: `/exercises/paragraphs?${params.toString()}`,
          timestamp: data.timestamp || 0
        });
      } catch (e) {}
    }

    list.sort((a, b) => b.timestamp - a.timestamp);
    setProgressList(list);
  }, []);

  if (progressList.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">Kaldığın Yerden Devam Et</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {progressList.map((prog, idx) => (
          <Link key={idx} href={prog.url} className="block group">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl ${prog.type === 'maths' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {prog.type === 'maths' ? '∑' : '¶'}
                </div>
                <div>
                  <h3 className="font-bold">{prog.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">En son {prog.questionNumber}. soruda kaldın</p>
                </div>
              </div>
              <div className="text-blue-500 font-medium group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
