import express from 'express';
import { getReservations } from '../../utils/dashboard/getReservations.js';
import { updateReservation } from '../../utils/dashboard/updateReservations.js'; // ✅ Fix name
import { dashboardConfig } from '../../utils/dashboard/dashboardConfig.js';

export const dashboardRouter = express.Router();

// ✅ GET /api/dashboard/:restaurantId/reservations
dashboardRouter.get('/:restaurantId/reservations', async (req, res) => {
  console.log('[DEBUG] dashboardRouter GET /:restaurantId/reservations called');

  const { restaurantId } = req.params;
  if (!restaurantId) {
    console.error('[ERROR] Missing restaurantId in URL');
    return res.status(400).json({ error: 'Missing restaurantId in URL' });
  }

  try {
    const reservations = await getReservations(restaurantId);
    return res.status(200).json({ reservations });
  } catch (err) {
    console.error('[ERROR] Failed to get reservations:', err.message);
    return res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// ✅ POST /api/dashboard/:restaurantId/updateReservation
dashboardRouter.post('/:restaurantId/updateReservation', async (req, res) => {
  console.log('[DEBUG] dashboardRouter POST /:restaurantId/updateReservation called');

  const { restaurantId } = req.params;
  const updatedData = req.body;

  if (!restaurantId) {
    console.error('[ERROR] Missing restaurantId in URL');
    return res.status(400).json({ error: 'Missing restaurantId in URL' });
  }

  const { id, ...fields } = updatedData;
  if (!id) {
    return res.status(400).json({ error: 'Missing record ID in update data' });
  }

  try {
    const result = await updateReservation(restaurantId, id, fields);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[ERROR] Failed to update reservation:', err.message);
    return res.status(500).json({ error: 'Failed to update reservation' });
  }
});
