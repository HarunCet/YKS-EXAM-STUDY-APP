import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ExercisesClient from '@/app/exercises/ExercisesClient';

export default async function ExercisesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get stats from metadata
  const stats = user.user_metadata?.exercise_stats || {
    mathsSolved: 0,
    mathsAccuracy: 0,
    paragraphsRead: 0,
    paragraphsAvgWpm: 0,
    sprintHighscore: 0,
    flashcardsStudied: 0,
  };

  return (
    <ExercisesClient 
      userEmail={user.email || ''} 
      initialStats={stats} 
    />
  );
}
