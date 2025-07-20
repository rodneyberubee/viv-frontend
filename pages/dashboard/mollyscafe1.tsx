// pages/dashboard/mollyscafe1.tsx

export default function Mollyscafe1Dashboard() {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ textAlign: 'center' }}>Molly’s Café Dashboard</h1>

      <p style={{ textAlign: 'center', color: '#888' }}>
        This is just a visual placeholder. Live data will come later.
      </p>

      <table style={{
        width: '100%',
        marginTop: '2rem',
        borderCollapse: 'collapse',
        border: '1px solid #ccc',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Confirmation</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Party Size</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Date</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Time</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ABC123</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>John Smith</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>2</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>2025-07-21</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>6:30 PM</td>
            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>confirmed</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
