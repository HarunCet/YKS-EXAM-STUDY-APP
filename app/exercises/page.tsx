import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import ExercisesClient from '@/app/exercises/ExercisesClient';

export default async function ExercisesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  // Get stats from metadata if user exists
  const stats = user?.user_metadata?.exercise_stats || null;

  return (
    <ExercisesClient 
      userEmail={user?.email || null} 
      initialStats={stats} 
    />
  );
}
