import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
};

type DashboardProps = {
  restaurantId: string;
};

const headerLabels: Record<string, string> = {
  date: 'Date',
  timeSlot: 'Time Slot',
  name: 'Name',
  partySize: 'Party Size',
  contactInfo: 'Contact Info',
  status: 'Status',
  confirmationCode: 'Confirmation Code',
};

const DashboardTemplate = ({ restaurantId }: DashboardProps) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config>({
    maxReservations: 0,
    futureCutoff: 0,
    timeZone: 'America/Los_Angeles',
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime>(
    DateTime.now().setZone('America/Los_Angeles').startOf('day')
  );

  // Handle token exchange -> JWT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const storedJwt = localStorage.getItem('jwtToken');

    async function verifyToken(token: string) {
      try {
        const res = await fetch('https://api.vivaitable.com/api/auth/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('jwtToken', data.token);
          setJwtToken(data.token);
          window.history.replaceState({}, '', window.location.pathname); // clean URL
        } else {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('[ERROR] Verifying token failed:', err);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    if (storedJwt) {
      setJwtToken(storedJwt);
      setLoading(false);
    } else if (urlToken) {
      verifyToken(urlToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  async function fetchConfig() {
    if (!jwtToken) return;
    try {
      const res = await fetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/config`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('[ERROR] Fetching config failed:', err);
    }
  }

  async function fetchReservations() {
    if (!jwtToken) return;
    try {
      const res = await fetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/reservations`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      const reservationsFromServer = data.reservations || [];

      const blankRowTemplate = reservationsFromServer.length
        ? Object.keys(reservationsFromServer[0]).reduce((acc, key) => {
            acc[key] = key === 'date'
              ? selectedDate.toFormat('yyyy-MM-dd')
              : '';
            return acc;
          }, {} as any)
        : { 
            date: selectedDate.toFormat('yyyy-MM-dd'),
            timeSlot: '', 
            name: '', 
            partySize: '', 
            contactInfo: '', 
            status: '', 
            confirmationCode: '' 
          };
      setReservations([...reservationsFromServer, blankRowTemplate]);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }

  useEffect(() => {
    if (jwtToken) {
      fetchConfig();
      fetchReservations();
    }
  }, [jwtToken, config.timeZone, selectedDate]);

  // Listen for BroadcastChannel events
  useEffect(() => {
    const bc = new BroadcastChannel('reservations');
    bc.onmessage = (e) => {
      if (e.data.type === 'reservationUpdate') {
        console.log('[DEBUG] Dashboard received reservationUpdate broadcast:', e.data.timestamp);
        fetchReservations();
      }
    };
    return () => bc.close();
  }, [jwtToken]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleReservationEdit = (e: React.ChangeEvent<HTMLInputElement>, id: string | undefined, index: number) => {
    const { name, value } = e.target;
    setReservations((prev) =>
      prev.map((res, i) =>
        res.id === id || (!res.id && i === index) ? { ...res, [name]: value } : res
      )
    );
  };

  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['restaurantId', 'baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(
      Object.entries(config)
        .filter(([key]) => !excluded.includes(key))
        .map(([key, val]) => [
          key,
          numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val
        ])
    );

    try {
      await fetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(cleaned),
      });
      alert('Config updated');
    } catch (err) {
      console.error('[ERROR] Updating config failed:', err);
    }
  };

  const updateReservations = async () => {
    if (!jwtToken) return;
    try {
      const payload = reservations
        .filter((res) => Object.keys(res).length > 0 && res.confirmationCode)
        .map(({ id, rawConfirmationCode, dateFormatted, ...fields }) => ({
          recordId: id,
          updatedFields: fields
        }));

      await fetch(`https://api.vivaitable.com/api/dashboard/${restaurantId}/updateReservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(payload),
      });
      alert('Reservations updated');
    } catch (err) {
      console.error('[ERROR] Updating reservations failed:', err);
    }
  };

  // ... rest of your UI stays unchanged ...

};

export default DashboardTemplate;
