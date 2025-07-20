import { useState } from 'react';

export default function Mollyscafe1Dashboard() {
  const [restaurantConfig, setRestaurantConfig] = useState({
    max_reservations: 10,
    future_cutoff: 30,
  });

  const [reservationData, setReservationData] = useState([
    {
      confirmationCode: 'ABC123',
      name: 'John Smith',
      partySize: 2,
      date: '2025-07-21',
      timeSlot: '6:30 PM',
      contactInfo: 'john@example.com',
      status: 'confirmed',
      notes: 'Birthday table',
    },
    {
      confirmationCode: 'XYZ456',
      name: 'Jane Doe',
      partySize: 4,
      date: '2025-07-21',
      timeSlot: '7:00 PM',
      contactInfo: 'jane@example.com',
      status: 'blocked',
      notes: '',
    },
  ]);

  const [updatedConfig, setUpdatedConfig] = useState({
    max_reservations: '',
    future_cutoff: '',
  });

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedConfig({
      ...updatedConfig,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateSettings = () => {
    console.log('SEND TO MIDDLEWARE: updateRestaurantMap', updatedConfig);
  };

  const handleCancel = (confirmationCode: string) => {
    console.log('SEND TO MIDDLEWARE: cancelReservation', confirmationCode);
  };

  const handleBlock = (confirmationCode: string) => {
    console.log('SEND TO MIDDLEWARE: blockTime', confirmationCode);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Molly’s Café Dashboard</h1>

      {/* --- Settings (View + Update) --- */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Restaurant Settings</h2>
        <p><strong>Max Reservations Per Slot:</strong> {restaurantConfig.max_reservations}</p>
        <p><strong>Advance Booking Cutoff (minutes):</strong> {restaurantConfig.future_cutoff}</p>

        <div style={{ marginTop: '1rem' }}>
          <label>
            Max Reservations:{' '}
            <input
              type="number"
              name="max_reservations"
              value={updatedConfig.max_reservations}
              onChange={handleSettingChange}
              style={{ marginRight: '1rem' }}
            />
          </label>
          <label>
            Booking Cutoff (mins):{' '}
            <input
              type="number"
              name="future_cutoff"
              value={updatedConfig.future_cutoff}
              onChange={handleSettingChange}
            />
          </label>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleUpdateSettings}>Update Settings</button>
          </div>
        </div>
      </section>

      {/* --- Reservations Table --- */}
      <section style={{ marginTop: '3rem' }}>
        <h2>Upcoming Reservations</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={th}>Code</th>
              <th style={th}>Guest Name</th>
              <th style={th}>Party Size</th>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Contact</th>
              <th style={th}>Status</th>
              <th style={th}>Notes</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservationData.map((res) => (
              <tr key={res.confirmationCode}>
                <td style={td}>{res.confirmationCode}</td>
                <td style={td}>{res.name}</td>
                <td style={td}>{res.partySize}</td>
                <td style={td}>{res.date}</td>
                <td style={td}>{res.timeSlot}</td>
                <td style={td}>{res.contactInfo}</td>
                <td style={td}>{res.status}</td>
                <td style={td}>{res.notes || '—'}</td>
                <td style={td}>
                  <button onClick={() => handleCancel(res.confirmationCode)} style={{ marginRight: '0.5rem' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleBlock(res.confirmationCode)}>
                    Block
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const th: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '0.5rem',
  backgroundColor: '#f9f9f9',
  textAlign: 'left',
};

const td: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '0.5rem',
};
