import axios from 'axios';

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		const status = error.response?.status || 0;
		const message = error.response?.data?.error || 'Serveur inaccessible';
		return Promise.reject({ status, message });
	},
);

export const authService = {
	register: async (userData) => {
		const { data } = await apiClient.post('/auth/register', userData);
		return data;
	},
	login: async (email, password) => {
		const { data } = await apiClient.post('/auth/login', { email, password });
		return data;
	},
};

export const reservationService = {
	getAll: async () => {
		const { data } = await apiClient.get('/reservations');
		return data;
	},
	create: async (payload) => {
		const { data } = await apiClient.post('/reservations', payload);
		return data;
	},
	update: async (id, payload) => {
		const { data } = await apiClient.put(`/reservations/${id}`, payload);
		return data;
	},
	remove: async (id) => {
		const { data } = await apiClient.delete(`/reservations/${id}`);
		return data;
	},
};

export default apiClient;