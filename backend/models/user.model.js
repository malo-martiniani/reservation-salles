import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

const SALT_ROUNDS = 10;

const User = {
    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase();
        const sql = 'SELECT id, email, password, created_at FROM users WHERE email = ? LIMIT 1';
        const rows = await query(sql, [normalizedEmail]);
        return rows[0] || null;
    },

    async create({ email, password }) {
        const normalizedEmail = email.toLowerCase();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        const result = await query(sql, [normalizedEmail, hashedPassword]);

        return {
            id: result.insertId,
            email: normalizedEmail,
        };
    },
};

export default User;