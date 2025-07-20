import { useState } from 'react';

export default function Mollyscafe1Dashboard() {
  // Dummy state — replace with real data later
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
      status: 'confirmed',
    },
    {
      confirmationCode: 'XYZ456',
      name: 'Jane Doe',
      partySize: 4,
      date: '2025-07-21',
      timeSlot: '7:00 PM',
      status: 'blocked',
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
    // TODO: POST to /api/control/updateRestaurantMap with restaurantId and updatedConfig
  };

  const handleCancel = (confirmationCode: string) => {
    console.log('SEND TO MIDDLEWARE: cancelReservation', confirmationCode);
    // TODO: POST to /api/cancelReservation with confirmationCode + restaurantId
  };

  const handleBlock = (confirmationCode: string) => {
    console.log('SEND TO MIDDLEWARE: blockTime for slot', confirmationCode);
    // TODO: POST to /api/control/blockTime with reservationId or time
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Molly’s Café Dashboard</h1>

      {/* --- Zone 1: Restaurant Settings View --- */}
      <section style={{ marginTop: '2rem' }}>
        <h2>🔍 Current Settings (Read)</h2>
        <p><strong>Max Reservations:</strong> {restaurantConfig.max_reservations}</p>
        <p><strong>Future Cutoff (mins):</strong> {restaurantConfig.future_cutoff}</p>
      </section>

      {/* --- Zone 2: Restaurant Settings Update --- */}
      <section style={{ marginTop: '2rem' }}>
        <h2>🛠️ Update Settings (Write)</h2>
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
          Future Cutoff (mins):{' '}
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
      </section>

      {/* --- Zone 3: Reservations View --- */}
      <section style={{ marginTop: '3rem' }}>
        <h2>📅 Current Reservations (Read)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={th}>Confirmation</th>
              <th style={th}>Name</th>
              <th style={th}>Party</th>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Status</th>
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
                <td style={td}>{res.status}</td>
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
  backgroundColor: '#f2f2f2',
};

const td: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '0.5rem',
};
