import { useEffect, useMemo, useState } from 'react';
import ReservationModal from '../components/ReservationModal.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { reservationService } from '../services/api.js';

function toInputDateTime(date) {
  const value = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Profile() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingReservation, setEditingReservation] = useState(null);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const loadMyReservations = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await reservationService.getAll();
      const allReservations = data.reservations || [];
      setReservations(allReservations);
    } catch (err) {
      setError(err.message || 'Impossible de charger vos réservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReservations();
  }, []);

  const myReservations = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.user_id === user?.id)
      .sort((a, b) => new Date(a.debut) - new Date(b.debut));
  }, [reservations, user?.id]);

  const handleDelete = async (reservationId) => {
    const confirmed = window.confirm('Confirmer l\'annulation de cette réservation ?');
    if (!confirmed) {
      return;
    }

    try {
      await reservationService.remove(reservationId);
      await loadMyReservations();
    } catch (err) {
      setError(err.message || 'Impossible d\'annuler la réservation');
    }
  };

  const openEditModal = (reservation) => {
    setModalError('');
    setEditingReservation(reservation);
  };

  const closeEditModal = () => {
    setEditingReservation(null);
    setModalError('');
  };

  const handleUpdate = async (payload) => {
    if (!editingReservation) {
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await reservationService.update(editingReservation.id, payload);
      closeEditModal();
      await loadMyReservations();
    } catch (err) {
      setModalError(err.message || 'Impossible de modifier la réservation');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="mb-6 text-sm text-gray-600">Mes réservations ({user?.email})</p>

        {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : myReservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Aucune réservation.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <ul className="divide-y divide-gray-200">
              {myReservations.map((reservation) => (
                <li key={reservation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{reservation.titre}</p>
                    <p className="text-sm text-gray-600">
                      Du {formatDateTime(reservation.debut)} au {formatDateTime(reservation.fin)}
                    </p>
                    {reservation.description && <p className="mt-1 text-sm text-gray-500">{reservation.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(reservation)}
                      className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reservation.id)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Annuler
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ReservationModal
        key={editingReservation ? `edit-${editingReservation.id}` : 'profile-modal'}
        isOpen={!!editingReservation}
        title="Modifier la réservation"
        submitLabel="Enregistrer"
        initialValues={
          editingReservation
            ? {
                titre: editingReservation.titre,
                description: editingReservation.description || '',
                debut: toInputDateTime(editingReservation.debut),
                fin: toInputDateTime(editingReservation.fin),
              }
            : undefined
        }
        onSubmit={handleUpdate}
        onClose={closeEditModal}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
}

export default Profile;
