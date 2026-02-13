import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import reservationRoutes from './routes/reservation.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'API réservation salles', status: 'online' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));

try {
	await testConnection();
	app.listen(PORT, () => {
		console.log(`Serveur sur http://localhost:${PORT}`);
	});
} catch (error) {
	console.error('Impossible de démarrer le serveur:', error.message);
	process.exit(1);
}