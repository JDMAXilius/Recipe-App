import { PlanScreen } from '@/features/planner';
import { usePlanMyWeek } from '@/catalogue/usePlanMyWeek';
import { flags } from '@/shared/flags';

// Plan (R4): "Otto, plan my week" is composed here (catalogue), under flowV2.
export default function Plan() {
  const planMyWeek = usePlanMyWeek(flags.flowV2);
  return <PlanScreen planMyWeek={flags.flowV2 ? planMyWeek : undefined} />;
}
