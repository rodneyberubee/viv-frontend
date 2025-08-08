import React from 'react';
import { useRouter } from 'next/router';
import Template from './template'; // ✅ Correct relative path inside the same folder

const SettingsDynamic = () => {
  const router = useRouter();
  const { restaurantId } = router.query;

  if (typeof restaurantId !== 'string') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Cast restaurantId to string so TS accepts it
  return <Template restaurantId={restaurantId as string} />;
};

export default SettingsDynamic;
