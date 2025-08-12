import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';

type Props = { restaurantId: string };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const restaurantId = (params?.restaurantId as string) ?? '';
  // Optionally validate restaurantId here
  return { props: { restaurantId } };
};

const SplitIframesPage: NextPage<Props> = ({ restaurantId }) => {
  const aiSrc = `/mollyscafe1`;                       // AI page
  const dashboardSrc = `/dashboard/demo-mollyscafe1`; // Demo dashboard

  // Header height used below; adjust if you change the header size.
  const headerPx = 56; // ~14px padding + text line-height ~ fits your current header
  const frameHeight = `calc(100vh - ${headerPx}px)`;

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="text-lg font-semibold">Viv — {restaurantId}</div>
        <div className="text-sm text-gray-600">AI · Demo Dashboard</div>
      </div>

      <div className="grid grid-cols-2 gap-0">
        {/* Left: Viv AI */}
        <div className="min-w-0 border-r">
          <div className="px-3 py-1 text-xs text-gray-600 bg-gray-50 border-b">AI: {aiSrc}</div>
          <iframe
            src={aiSrc}
            title="Viv AI"
            className="w-full"
            style={{ height: frameHeight, display: 'block' }}
            frameBorder={0}
            allow="clipboard-write; microphone; camera"
          />
        </div>

        {/* Right: Dashboard */}
        <div className="min-w-0">
          <div className="px-3 py-1 text-xs text-gray-600 bg-gray-50 border-b">Dashboard: {dashboardSrc}</div>
          <iframe
            src={dashboardSrc}
            title="Viv Demo Dashboard"
            className="w-full"
            style={{ height: frameHeight, display: 'block' }}
            frameBorder={0}
          />
        </div>
      </div>
    </div>
  );
};

export default SplitIframesPage;
