import React from 'react';
import { useRouter } from 'next/router';

const SplitIframesPage: React.FC = () => {
  const router = useRouter();
  const { restaurantId } = router.query as { restaurantId?: string };

  // Guard until router is ready
  if (!restaurantId) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  // Left: Viv AI page      -> /[restaurantId]
  // Right: Demo dashboard  -> /dashboard/demo-mollyscafe1
  const aiSrc = `/${restaurantId}`;
  const dashboardSrc = `/dashboard/demo-mollyscafe1`;

  return (
    <div className="min-h-screen w-full">
      {/* Optional header strip (remove if not desired) */}
      <div className="w-full px-4 py-2 border-b bg-white flex items-center justify-between">
        <div className="text-lg font-semibold">Viv — {restaurantId}</div>
        <div className="text-sm text-gray-600">AI + Dashboard (demo)</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="h-[calc(100vh-48px)] border-r">
          <iframe
            key={`ai-${restaurantId}`}
            src={aiSrc}
            title="Viv AI"
            className="w-full h-full"
            frameBorder={0}
            allow="clipboard-write; microphone; camera"
          />
        </div>
        <div className="h-[calc(100vh-48px)]">
          <iframe
            key={`dash-${restaurantId}`}
            src={dashboardSrc}
            title="Viv Demo Dashboard"
            className="w-full h-full"
            frameBorder={0}
          />
        </div>
      </div>
    </div>
  );
};

export default SplitIframesPage;

