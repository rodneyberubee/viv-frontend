import { useRouter } from 'next/router';
import DashboardTemplate from './template';

export default function DashboardRepeater() {
  const router = useRouter();
  const { restaurantId } = router.query;
  if (!restaurantId) return <div>Loading...</div>;
  return <DashboardTemplate restaurantId={restaurantId as string} />;
}
