import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SorularClient from './SorularClient';

export default async function SorularPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const wrongQuestions = user.user_metadata?.wrong_questions || [];
  const practiceExams = user.user_metadata?.practice_exams || [];

  return (
    <SorularClient
      initialWrongQuestions={wrongQuestions}
      initialPracticeExams={practiceExams}
      userEmail={user.email || ''}
    />
  );
}

