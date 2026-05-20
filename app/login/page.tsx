'use client';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
  };

  return (

    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded bg-white p-6 shadow-md dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold text-center dark:text-zinc-50">Giriş Yap</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border p-2"
          required
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border p-2"
          required
        />
        <button type="submit" className="rounded bg-foreground p-2 text-background hover:bg-gray-700">
          Giriş
        </button>
        <p className="mt-2 text-center text-sm dark:text-zinc-400">
          Hesabın yok mu? <a href="/signup" className="text-blue-600 dark:text-blue-400">Kayıt Ol</a>
        </p>
      </form>
    </div>
  );
}
