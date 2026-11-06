import { useLocalSearchParams } from 'expo-router';
import { QuestionScreen } from '@/features/onboarding';

export default function About() {
  const { step } = useLocalSearchParams<{ step: string }>();
  return <QuestionScreen step={Number(step)} />;
}
