// pages/split-demo.tsx
import React from 'react';

const headerPx = 56; // adjust if you change the header height
const frameHeight = `calc(100vh - ${headerPx}px)`;

const SplitDemoPage: React.FC = () => {
  const aiSrc = `/mollyscafe1`;
  const dashboardSrc = `/dashboard/demo-mollyscafe1`;

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="text-lg font-semibold">Viv — mollyscafe1</div>
        <div className="text-sm text-gray-600">AI · Demo Dashboard</div>
      </div>

      <div className="grid grid-cols-2 gap-0">
        {/* Left: Viva */}
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

export default SplitDemoPage;
