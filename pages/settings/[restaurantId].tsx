import React from 'react';
import { useRouter } from 'next/router';
import SettingsPage from '../../components/template'; // adjust path if needed

const SettingsDynamic = () => {
  const router = useRouter();
  const { restaurantId } = router.query;

  if (typeof restaurantId !== 'string') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return <SettingsPage restaurantId={restaurantId} />;
};

export default SettingsDynamic;
