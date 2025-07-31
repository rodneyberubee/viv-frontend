import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import jwtDecode from 'jwt-decode'; // ✅ Add this to decode exp

type Config = {
  maxReservations: number;
  futureCutoff: number;
  timeZone?: string;
  [key: string]: any;
};

type DashboardProps = {
  restaurantId: string;
};

type JWTPayload = { exp: number; restaurantId: string; email: string }; // ✅ For decoding

// ... keep your headerLabels, editableFields, etc.

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

  // ✅ Helper: check if a token is expired
  const isTokenExpired = (token: string) => {
    try {
      const decoded: JWTPayload = jwtDecode(token);
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  };

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
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('[ERROR] Verifying token failed:', err);
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    // ✅ Logic order:
    // 1. If URL has magic link → verify & save
    if (urlToken) {
      verifyToken(urlToken);
    } 
    // 2. Else if stored JWT exists & is still valid → reuse
    else if (storedJwt && !isTokenExpired(storedJwt)) {
      setJwtToken(storedJwt);
      setLoading(false);
    } 
    // 3. Else → redirect to login
    else {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
  }, []);

  // Auto-logout if token is invalid on any fetch
  async function safeFetch(url: string, options: any) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    return res;
  }

  // ... rest of your fetchConfig, fetchReservations, updateConfig, updateReservations unchanged

  useEffect(() => {
    if (jwtToken) {
      fetchConfig();
      fetchReservations();
    }
  }, [jwtToken, config.timeZone, selectedDate]);

  // ... rest of your component unchanged
};

export default DashboardTemplate;
