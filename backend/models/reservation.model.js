import { query } from '../config/db.js';

const Reservation = {
  async findAll() {
    const sql = `
      SELECT r.id, r.titre, r.description, r.debut, r.fin, r.user_id, r.created_at, u.email
      FROM reservations r
      INNER JOIN users u ON u.id = r.user_id
      ORDER BY r.debut ASC
    `;
    return query(sql);
  },

  async findById(id) {
    const sql = `
      SELECT id, titre, description, debut, fin, user_id, created_at
      FROM reservations
      WHERE id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async hasOverlap({ debut, fin, excludeId = null }) {
    let sql = `
      SELECT COUNT(*) AS overlapCount
      FROM reservations
      WHERE debut < ?
        AND fin > ?
    `;
    const params = [fin, debut];

    if (excludeId !== null) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }

    const rows = await query(sql, params);
    return Number(rows[0]?.overlapCount || 0) > 0;
  },

  async create({ titre, description, debut, fin, userId }) {
    const sql = `
      INSERT INTO reservations (titre, description, debut, fin, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [titre, description || null, debut, fin, userId]);

    return {
      id: result.insertId,
      titre,
      description: description || null,
      debut,
      fin,
      user_id: userId,
    };
  },

  async update({ id, titre, description, debut, fin }) {
    const sql = `
      UPDATE reservations
      SET titre = ?, description = ?, debut = ?, fin = ?
      WHERE id = ?
    `;

    const result = await query(sql, [titre, description || null, debut, fin, id]);
    return result.affectedRows > 0;
  },

  async remove(id) {
    const sql = 'DELETE FROM reservations WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
};

export default Reservation;
