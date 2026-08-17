import { Router } from 'express';
import { getAdapterForTrackingNumber, listCarriers } from '../carriers/registry.js';

const router = Router();

const TRACKING_NUMBER_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

router.get('/carriers', (_req, res) => {
  res.json({ carriers: listCarriers() });
});

router.get('/track/:number', async (req, res, next) => {
  try {
    const trackingNumber = req.params.number.trim().toUpperCase();

    if (!TRACKING_NUMBER_PATTERN.test(trackingNumber)) {
      return res.status(400).json({
        error: 'INVALID_TRACKING_NUMBER',
        message: 'Le numéro de suivi est invalide.',
      });
    }

    const adapter = getAdapterForTrackingNumber(trackingNumber);
    if (!adapter) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        message: 'Aucun colis trouvé pour ce numéro de suivi.',
      });
    }

    const result = await adapter.track(trackingNumber);
    if (!result) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        message: 'Aucun colis trouvé pour ce numéro de suivi.',
      });
    }

    res.json({
      carrier: { code: adapter.code, name: adapter.name },
      shipment: result.shipment,
      events: result.events,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
