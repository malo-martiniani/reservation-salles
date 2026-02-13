import Reservation from '../models/reservation.model.js';

const MIN_DURATION_MS = 60 * 60 * 1000;
const OPEN_HOUR = 8;
const CLOSE_HOUR = 19;

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isWithinAllowedHours(startDate, endDate) {
  const startTotalMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endTotalMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  const minStart = OPEN_HOUR * 60;
  const maxEnd = CLOSE_HOUR * 60;

  return startTotalMinutes >= minStart && endTotalMinutes <= maxEnd;
}

function validateReservationPayload({ titre, debut, fin }) {
  if (!titre || !debut || !fin) {
    return { valid: false, status: 400, error: 'Les champs titre, debut et fin sont requis' };
  }

  const startDate = parseDate(debut);
  const endDate = parseDate(fin);

  if (!startDate || !endDate) {
    return { valid: false, status: 400, error: 'Format de date invalide' };
  }

  if (startDate >= endDate) {
    return { valid: false, status: 400, error: 'La date de fin doit être après la date de début' };
  }

  if (startDate.getTime() < Date.now()) {
    return { valid: false, status: 400, error: 'Impossible de réserver dans le passé' };
  }

  if (!isWeekday(startDate) || !isWeekday(endDate)) {
    return { valid: false, status: 400, error: 'Réservation autorisée uniquement du lundi au vendredi' };
  }

  if (!isWithinAllowedHours(startDate, endDate)) {
    return { valid: false, status: 400, error: 'Horaires autorisés de 08h00 à 19h00' };
  }

  if (endDate.getTime() - startDate.getTime() < MIN_DURATION_MS) {
    return { valid: false, status: 400, error: 'Durée minimale: 1 heure' };
  }

  return { valid: true, startDate, endDate };
}

export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    return res.status(200).json({ reservations });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createReservation = async (req, res) => {
  try {
    const { titre, description, debut, fin } = req.body;
    const validation = validateReservationPayload({ titre, debut, fin });

    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const overlap = await Reservation.hasOverlap({
      debut: validation.startDate,
      fin: validation.endDate,
    });

    if (overlap) {
      return res.status(409).json({ error: 'Ce créneau chevauche une réservation existante' });
    }

    const created = await Reservation.create({
      titre: titre.trim(),
      description,
      debut: validation.startDate,
      fin: validation.endDate,
      userId: req.user.id,
    });

    return res.status(201).json({ message: 'Réservation créée', reservation: created });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    if (Number.isNaN(reservationId)) {
      return res.status(400).json({ error: 'ID de réservation invalide' });
    }

    const existing = await Reservation.findById(reservationId);
    if (!existing) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée pour cette réservation' });
    }

    const { titre, description, debut, fin } = req.body;
    const validation = validateReservationPayload({ titre, debut, fin });

    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const overlap = await Reservation.hasOverlap({
      debut: validation.startDate,
      fin: validation.endDate,
      excludeId: reservationId,
    });

    if (overlap) {
      return res.status(409).json({ error: 'Ce créneau chevauche une réservation existante' });
    }

    const updated = await Reservation.update({
      id: reservationId,
      titre: titre.trim(),
      description,
      debut: validation.startDate,
      fin: validation.endDate,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }

    return res.status(200).json({ message: 'Réservation mise à jour' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    if (Number.isNaN(reservationId)) {
      return res.status(400).json({ error: 'ID de réservation invalide' });
    }

    const existing = await Reservation.findById(reservationId);
    if (!existing) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée pour cette réservation' });
    }

    const deleted = await Reservation.remove(reservationId);
    if (!deleted) {
      return res.status(404).json({ error: 'Réservation introuvable' });
    }

    return res.status(200).json({ message: 'Réservation supprimée' });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
