import React from 'react';
import { useRouter } from 'next/router';
import Template from './template'; // ✅ Correct relative path inside the same folder

const SettingsDynamic = () => {
  const router = useRouter();
  const { restaurantId } = router.query;

  if (typeof restaurantId !== 'string') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return <Template restaurantId={restaurantId} />;
};

export default SettingsDynamic;
