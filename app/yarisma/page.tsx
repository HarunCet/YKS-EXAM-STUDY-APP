import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import YarismaClient from '@/app/yarisma/YarismaClient';

export default async function YarismaPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <YarismaClient 
      userEmail={user.email || 'Öğrenci'} 
      userMetadata={user.user_metadata || {}} 
    />
  );
}
