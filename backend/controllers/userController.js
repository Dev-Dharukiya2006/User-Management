const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function logActivity(req, action, entityId, details = null) {
  try {
    const actorId = req.user?.id;
    if (!actorId) return; // shouldn't happen since routes require verifyToken
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [actorId, action, 'user', entityId, details ? JSON.stringify(details) : null, ipAddress]
    );
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}

async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching users.' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching user.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalRole = role === 'admin' ? 'admin' : 'user';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, finalRole]
    );

    await logActivity(req, 'create_user', result.insertId, { name, email, role: finalRole });

    res.status(201).json({
      message: 'User created successfully.',
      user: { id: result.insertId, name, email, role: finalRole },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating user.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingUser = rows[0];
    const updatedName = name || existingUser.name;
    const updatedEmail = email || existingUser.email;
    const updatedRole = role || existingUser.role;
    const updatedPassword = password
      ? await bcrypt.hash(password, 10)
      : existingUser.password;

    await pool.query(
      'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedPassword, updatedRole, id]
    );

    await logActivity(req, 'update_user', Number(id), {
      name: updatedName,
      email: updatedEmail,
      role: updatedRole,
      password_changed: Boolean(password),
    });

    res.json({
      message: 'User updated successfully.',
      user: { id: Number(id), name: updatedName, email: updatedEmail, role: updatedRole },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating user.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT name, email, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const deletedUser = rows[0];

    // Log before deleting, so the entry isn't lost to a foreign key issue
    await logActivity(req, 'delete_user', Number(id), deletedUser);

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting user.' });
  }
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };