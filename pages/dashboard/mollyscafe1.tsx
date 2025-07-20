import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Dashboard = () => {
  const [restaurantId, setRestaurantId] = useState('mollyscafe1');
  const [restaurantData, setRestaurantData] = useState<any>({});
  const [reservationUpdates, setReservationUpdates] = useState<any>({});
  const [mapUpdates, setMapUpdates] = useState<any>({});

  const fetchData = async () => {
    const res = await fetch(`/api/control/dashboard/${restaurantId}`);
    const data = await res.json();
    setRestaurantData(data);
  };

  const pushReservationUpdate = async () => {
    await fetch(`/api/control/updateReservation/${restaurantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationUpdates),
    });
    fetchData();
  };

  const pushMapUpdate = async () => {
    await fetch(`/api/control/updateRestaurantMap/${restaurantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapUpdates),
    });
    fetchData();
  };

  return (
    <div className="p-4 grid gap-4">
      <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Restaurant Settings Viewer */}
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-xl font-semibold">Restaurant Settings</h2>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(restaurantData.restaurantMap, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Reservation Viewer */}
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-xl font-semibold">Reservation Table</h2>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(restaurantData.reservations, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Map Update Form */}
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-lg font-medium">Update Restaurant Info</h2>
            <Input
              placeholder="Max Reservations"
              onChange={(e) => setMapUpdates({ ...mapUpdates, maxReservations: e.target.value })}
            />
            <Input
              placeholder="Future Cutoff Time"
              onChange={(e) => setMapUpdates({ ...mapUpdates, futureCutoff: e.target.value })}
            />
            <Button onClick={pushMapUpdate}>Update Settings</Button>
          </CardContent>
        </Card>

        {/* Reservation Update Form */}
        <Card>
          <CardContent className="space-y-2">
            <h2 className="text-lg font-medium">Update or Add Reservation</h2>
            <Input
              placeholder="Guest Name"
              onChange={(e) => setReservationUpdates({ ...reservationUpdates, name: e.target.value })}
            />
            <Input
              placeholder="Party Size"
              onChange={(e) => setReservationUpdates({ ...reservationUpdates, partySize: e.target.value })}
            />
            <Input
              placeholder="Date (YYYY-MM-DD)"
              onChange={(e) => setReservationUpdates({ ...reservationUpdates, date: e.target.value })}
            />
            <Input
              placeholder="Time Slot (e.g. 7:00 PM)"
              onChange={(e) => setReservationUpdates({ ...reservationUpdates, timeSlot: e.target.value })}
            />
            <Input
              placeholder="Contact Info"
              onChange={(e) => setReservationUpdates({ ...reservationUpdates, contactInfo: e.target.value })}
            />
            <Button onClick={pushReservationUpdate}>Submit Reservation</Button>
          </CardContent>
        </Card>
      </div>

      <Button onClick={fetchData}>Refresh Dashboard</Button>
    </div>
  );
};
