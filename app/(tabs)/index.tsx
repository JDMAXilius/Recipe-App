import { DiscoverScreen } from '@/features/recipes';
import { HomeTop } from '@/features/home';
import { BillingIssueBanner } from '@/features/profile';
import { flags } from '@/shared/flags';

// Home (R3.2, flowV2): the billing line when Apple is retrying a payment
// (R2.7), then Tonight + This week above Discover's sections. Off: Discover.
export default function Home() {
  return (
    <DiscoverScreen
      top={
        flags.flowV2 ? (
          <>
            <BillingIssueBanner />
            <HomeTop />
          </>
        ) : undefined
      }
    />
  );
}
