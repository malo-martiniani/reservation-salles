import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Token manquant' });
	}

	if (!process.env.JWT_SECRET) {
		return res.status(500).json({ error: 'Configuration JWT manquante' });
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: decoded.id, email: decoded.email };
		return next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ error: 'Token expiré' });
		}
		return res.status(401).json({ error: 'Token invalide' });
	}
};

export default authMiddleware;