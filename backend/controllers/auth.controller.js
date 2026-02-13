import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });
};

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Configuration JWT manquante' });
    }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email déjà utilisé' });
        }

        const user = await User.create({ email, password });
        const token = generateToken(user);

        return res.status(201).json({
            message: 'Inscription réussie',
            user,
            token,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erreur serveur' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Configuration JWT manquante' });
    }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: 'Connexion réussie',
            user: {
                id: user.id,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erreur serveur' });
    }
};