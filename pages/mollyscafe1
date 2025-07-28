import { useRouter } from 'next/router';
import VivAChatTemplate from './template';

export default function VivARepeater() {
  const router = useRouter();
  const { restaurantId } = router.query;

  if (!restaurantId) return <div>Loading...</div>;

  return <VivAChatTemplate restaurantId={restaurantId as string} />;
}
