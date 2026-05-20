'use client';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setMessage('');
    } else {
      setMessage('Kayıt başarılı! Lütfen giriş yapın.');
      setError('');
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded bg-white p-6 shadow-md dark:bg-zinc-900 w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center dark:text-zinc-50">Kayıt Ol</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
          required
        />
        <input
          type="password"
          placeholder="Şifre (En az 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
          required
          minLength={6}
        />
        <button type="submit" className="rounded bg-foreground p-2 text-background hover:bg-gray-700 transition-colors">
          Kayıt Ol
        </button>
        <p className="mt-2 text-center text-sm dark:text-zinc-400">
          Zaten hesabın var mı? <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Giriş Yap</a>
        </p>
      </form>
    </div>
  );
}
