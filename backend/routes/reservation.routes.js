import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from '../controllers/reservation.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getReservations);
router.post('/', createReservation);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);

export default router;
