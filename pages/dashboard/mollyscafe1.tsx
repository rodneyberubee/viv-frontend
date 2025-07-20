import { useEffect, useState } from 'react';

const MollysCafeDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch('/api/dashboard/mollyscafe1');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load reservations.');
        setReservations(data.reservations);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Molly’s Cafe Dashboard</h1>
      <table border="1" cellPadding="10" style={{ marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Confirmation</th>
            <th>Name</th>
            <th>Party Size</th>
            <th>Date</th>
            <th>Time</th>
            <th>Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r: any) => (
            <tr key={r.confirmationCode}>
              <td>{r.confirmationCode}</td>
              <td>{r.name}</td>
              <td>{r.partySize}</td>
              <td>{r.date}</td>
              <td>{r.timeSlot}</td>
              <td>{r.contactInfo}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MollysCafeDashboard;

