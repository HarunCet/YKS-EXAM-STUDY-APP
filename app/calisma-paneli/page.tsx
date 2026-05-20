import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CalismaPaneliClient from './CalismaPaneliClient';

export default async function CalismaPaneliPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const tasks = user.user_metadata?.tasks || [];
  const subjectNotes = user.user_metadata?.subject_notes || {};

  return (
    <CalismaPaneliClient 
      initialTasks={tasks} 
      initialSubjectNotes={subjectNotes} 
      userEmail={user.email || ''} 
    />
  );
}
