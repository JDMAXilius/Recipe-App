import { PlanScreen, PlanTab } from '@/features/planner';
import { usePlanMyWeek } from '@/catalogue/usePlanMyWeek';
import { flags } from '@/shared/flags';

// Plan (R4): under flowV2 the tab is Week · Shopping (R4.5) and "Otto, plan my
// week" is composed here (catalogue).
export default function Plan() {
  const planMyWeek = usePlanMyWeek(flags.flowV2);
  return flags.flowV2 ? <PlanTab planMyWeek={planMyWeek} /> : <PlanScreen />;
}
