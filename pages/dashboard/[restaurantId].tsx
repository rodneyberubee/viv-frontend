import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardTemplate from './template';

export default function DashboardRepeater() {
  const router = useRouter();
  const { restaurantId } = router.query;
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    // Log router query for debugging
    console.log('[DEBUG] router.query:', router.query);

    if (restaurantId) {
      // Handle cases where router.query might return an array
      const id = Array.isArray(restaurantId) ? restaurantId[0] : restaurantId;
      setResolvedId(id);
    }
  }, [restaurantId]);

  if (!resolvedId) {
    return <div className="p-8 text-center">Loading dashboard…</div>;
  }

  return <DashboardTemplate restaurantId={resolvedId} />;
}
