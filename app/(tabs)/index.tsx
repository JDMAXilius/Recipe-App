import { DiscoverScreen } from '@/features/recipes';
import { HomeTop } from '@/features/home';
import { flags } from '@/shared/flags';

// Home (R3.2, flowV2): Tonight + This week above Discover's sections. Off: Discover.
export default function Home() {
  return <DiscoverScreen top={flags.flowV2 ? <HomeTop /> : undefined} />;
}
