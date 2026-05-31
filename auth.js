const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });

    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    run(`INSERT INTO users (id,name,email,phone,password_hash,balance,points) VALUES (?,?,?,?,?,0,0)`,
      [id, name, email, phone || '', hash]);

    // Welcome notification
    run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
      [uuidv4(), id, 'Selamat datang di Zeedone! 🎉', 'Akun kamu berhasil dibuat. Mulai belajar sekarang!', 'welcome']);

    const token = jwt.sign({ id, email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
    const user = queryOne('SELECT id,name,email,phone,role,balance,points,created_at FROM users WHERE id = ?', [id]);

    res.status(201).json({ success: true, message: 'Registrasi berhasil!', token, user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: 'Login berhasil!', token, user: safeUser });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const { password_hash, ...user } = req.user;
  const enrollCount = queryOne('SELECT COUNT(*) as c FROM enrollments WHERE user_id = ?', [user.id]);
  const orderCount = queryOne('SELECT COUNT(*) as c FROM orders WHERE user_id = ?', [user.id]);
  const bookingCount = queryOne('SELECT COUNT(*) as c FROM bookings WHERE user_id = ?', [user.id]);
  const unreadNotif = queryOne('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0', [user.id]);

  res.json({
    success: true,
    user: {
      ...user,
      stats: {
        courses_enrolled: enrollCount?.c || 0,
        orders: orderCount?.c || 0,
        bookings: bookingCount?.c || 0,
        unread_notifications: unreadNotif?.c || 0,
      }
    }
  });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong.' });

  run(`UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?`,
    [name, phone || '', req.user.id]);

  const updated = queryOne('SELECT id,name,email,phone,role,balance,points FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, message: 'Profil berhasil diperbarui.', user: updated });
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });

  if (new_password.length < 6)
    return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });

  const valid = bcrypt.compareSync(current_password, req.user.password_hash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Password lama salah.' });

  const hash = bcrypt.hashSync(new_password, 10);
  run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ success: true, message: 'Password berhasil diubah.' });
});

module.exports = router;
