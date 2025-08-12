import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';

type Props = { restaurantId: string };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const restaurantId = (params?.restaurantId as string) ?? '';
  // Optionally validate restaurantId here
  return { props: { restaurantId } };
};

const SplitIframesPage: NextPage<Props> = ({ restaurantId }) => {
  const aiSrc = `/combined/mollyscafe1`;                
  const dashboardSrc = `/dashboard/demo-mollyscafe1`; // pages/dashboard/demo-mollyscafe1.tsx

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-2 border-b bg-white flex items-center justify-between">
        <div className="text-lg font-semibold">Viv — {restaurantId}</div>
        <div className="text-sm text-gray-600">AI · Demo Dashboard</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="h-[calc(100vh-48px)] border-r">
          <iframe
            src={aiSrc}
            title="Viv AI"
            className="w-full h-full"
            frameBorder={0}
            allow="clipboard-write; microphone; camera"
          />
        </div>
        <div className="h-[calc(100vh-48px)]">
          <iframe
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
