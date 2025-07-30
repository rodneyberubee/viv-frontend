  const updateConfig = async () => {
    if (!jwtToken) return;
    const numericFields = ['maxReservations', 'futureCutoff'];
    const excluded = ['baseId', 'tableId', 'name', 'autonumber', 'slug', 'calibratedTime', 'tableName'];
    const cleaned = Object.fromEntries(
      Object.entries(config)
        .filter(([key]) => !excluded.includes(key))
        .map(([key, val]) => [
          key,
          numericFields.includes(key) ? parseInt(String(val), 10) || 0 : val
        ])
    );

    // Ensure restaurantId is sent back with config
    cleaned.restaurantId = restaurantId;

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
          restaurantId, // <-- include restaurantId for backend
          recordId: id,
          updatedFields: {
            ...fields,
            partySize: fields.partySize ? parseInt(fields.partySize, 10) : fields.partySize
          }
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
            confirmationCode: '',
            restaurantId // <-- ensure new rows also carry restaurantId
          };
      setReservations([...reservationsFromServer, blankRowTemplate]);
    } catch (err) {
      console.error('[ERROR] Fetching reservations failed:', err);
    }
  }
