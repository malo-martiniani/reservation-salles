import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { reservationService } from '../services/api.js';
import ReservationModal from '../components/ReservationModal.jsx';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const START_HOUR = 8;
const END_HOUR = 19;

function startOfWeekMonday(date) {
    const value = new Date(date);
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diff);
    value.setHours(0, 0, 0, 0);
    return value;
}

function addDays(date, days) {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function toInputDateTime(date) {
    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatShortDate(date) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatHour(hour) {
    return `${String(hour).padStart(2, '0')}:00`;
}

function Dashboard() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalInitialValues, setModalInitialValues] = useState({ titre: '', description: '', debut: '', fin: '' });

    const monday = useMemo(() => startOfWeekMonday(new Date()), []);
    const weekDays = useMemo(() => DAY_LABELS.map((label, index) => ({ label, date: addDays(monday, index) })), [monday]);
    const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index), []);

    const loadReservations = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await reservationService.getAll();
            setReservations(data.reservations || []);
        } catch (err) {
            setError(err.message || 'Impossible de charger les réservations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReservations();
    }, []);

    const weekEnd = useMemo(() => {
        const value = addDays(monday, 5);
        value.setHours(0, 0, 0, 0);
        return value;
    }, [monday]);

    const weekReservations = useMemo(() => {
        return reservations.filter((reservation) => {
            const start = new Date(reservation.debut);
            return start >= monday && start < weekEnd;
        });
    }, [reservations, monday, weekEnd]);

    const findReservationForCell = (dayDate, hour) => {
        const slotStart = new Date(dayDate);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(dayDate);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        return weekReservations.find((reservation) => {
            const reservationStart = new Date(reservation.debut);
            const reservationEnd = new Date(reservation.fin);
            return reservationStart < slotEnd && reservationEnd > slotStart;
        });
    };

    const openSlotModal = (dayDate, hour) => {
        const start = new Date(dayDate);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(dayDate);
        end.setHours(hour + 1, 0, 0, 0);

        setSelectedSlot({ dayDate, hour });
        setModalError('');
        setModalInitialValues({
            titre: '',
            description: '',
            debut: toInputDateTime(start),
            fin: toInputDateTime(end),
        });
    };

    const closeModal = () => {
        setSelectedSlot(null);
        setModalError('');
    };

    const handleCreateReservation = async (payload) => {
        setModalLoading(true);
        setModalError('');

        try {
            await reservationService.create(payload);
            closeModal();
            await loadReservations();
        } catch (err) {
            setModalError(err.message || 'Impossible de créer la réservation');
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Planning hebdomadaire</h1>
                        <p className="text-sm text-gray-600">
                            Semaine du {formatShortDate(monday)} au {formatShortDate(addDays(monday, 4))}
                        </p>
                    </div>
                    <p className="text-sm text-gray-700">Connecté : {user?.email}</p>
                </div>

                {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

                {loading ? (
                    <p className="text-gray-600">Chargement du planning...</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <div className="grid" style={{ gridTemplateColumns: '90px repeat(5, minmax(180px, 1fr))' }}>
                            <div className="border-b border-r border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-700">Heure</div>
                            {weekDays.map((day) => (
                                <div key={day.label} className="border-b border-r border-gray-200 bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700">
                                    <div>{day.label}</div>
                                    <div className="text-xs font-normal text-gray-500">{formatShortDate(day.date)}</div>
                                </div>
                            ))}

                            {hours.map((hour) => (
                                <Fragment key={`row-${hour}`}>
                                    <div key={`hour-${hour}`} className="border-b border-r border-gray-200 p-3 text-sm text-gray-600">
                                        {formatHour(hour)}
                                    </div>
                                    {weekDays.map((day) => {
                                        const reservation = findReservationForCell(day.date, hour);
                                        const isMine = reservation?.user_id === user?.id;

                                        if (reservation) {
                                            return (
                                                <div
                                                    key={`${day.label}-${hour}`}
                                                    className={`min-h-20 border-b border-r border-gray-200 p-2 text-xs ${
                                                        isMine ? 'bg-blue-100 text-blue-900' : 'bg-red-100 text-red-900'
                                                    }`}
                                                >
                                                    <p className="font-semibold">{reservation.titre}</p>
                                                    <p className="truncate">{reservation.email}</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                key={`${day.label}-${hour}`}
                                                type="button"
                                                onClick={() => openSlotModal(day.date, hour)}
                                                className="min-h-20 border-b border-r border-gray-200 bg-white p-2 text-left text-xs text-gray-400 hover:bg-gray-50"
                                            >
                                                Disponible
                                            </button>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ReservationModal
                key={selectedSlot ? `${selectedSlot.dayDate.getTime()}-${selectedSlot.hour}` : 'dashboard-modal'}
                isOpen={!!selectedSlot}
                title="Nouvelle réservation"
                submitLabel="Enregistrer"
                initialValues={modalInitialValues}
                onSubmit={handleCreateReservation}
                onClose={closeModal}
                loading={modalLoading}
                error={modalError}
            />
        </div>
    );
}

export default Dashboard;