import { SignUpScreen } from '@/features/auth';
import { useDraft } from '@/features/onboarding';
import { flags } from '@/shared/flags';

// With a saved first week (flowV2) sign-up is "Save your plan" (R1.5). The
// route composes the two features; neither imports the other.
export default function SignUp() {
  const { draft } = useDraft();
  const week = flags.flowV2 && draft && draft.week.length > 0 ? draft.week : null;
  return <SignUpScreen savePlan={week ? { tonight: week[0].title, dinners: week.length } : null} />;
}
