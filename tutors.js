const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware, adminOnly, optionalAuth } = require('../middleware/auth');

// GET /api/tutors
router.get('/', optionalAuth, (req, res) => {
  const { subject, mode, search, sort, limit = 20, offset = 0 } = req.query;
  let sql = `SELECT * FROM tutors WHERE is_active = 1`;
  const params = [];

  if (subject) { sql += ` AND subjects LIKE ?`; params.push(`%${subject}%`); }
  if (mode)    { sql += ` AND (availability = ? OR availability = 'both')`; params.push(mode); }
  if (search)  { sql += ` AND (name LIKE ? OR subjects LIKE ? OR bio LIKE ?)`; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }

  if (sort === 'rating')    sql += ' ORDER BY rating DESC, total_students DESC';
  else if (sort === 'price_low')  sql += ' ORDER BY rate_per_hour ASC';
  else if (sort === 'price_high') sql += ' ORDER BY rate_per_hour DESC';
  else if (sort === 'popular')    sql += ' ORDER BY total_students DESC';
  else sql += ' ORDER BY rating DESC, total_students DESC';

  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const tutors = query(sql, params);
  const total = queryOne('SELECT COUNT(*) as c FROM tutors WHERE is_active = 1');

  res.json({ success: true, total: total?.c || 0, tutors });
});

// GET /api/tutors/:id
router.get('/:id', (req, res) => {
  const tutor = queryOne('SELECT * FROM tutors WHERE id = ? AND is_active = 1', [req.params.id]);
  if (!tutor) return res.status(404).json({ success: false, message: 'Tutor tidak ditemukan.' });
  res.json({ success: true, tutor });
});

// POST /api/tutors/:id/book - book a session
router.post('/:id/book', authMiddleware, (req, res) => {
  const { subject, mode, scheduled_at, duration_minutes, notes } = req.body;

  if (!subject || !scheduled_at)
    return res.status(400).json({ success: false, message: 'Mata pelajaran dan jadwal wajib diisi.' });

  const tutor = queryOne('SELECT * FROM tutors WHERE id = ? AND is_active = 1', [req.params.id]);
  if (!tutor) return res.status(404).json({ success: false, message: 'Tutor tidak ditemukan.' });

  const dur = Number(duration_minutes) || 60;
  const pricePerHour = tutor.rate_per_hour;
  const total = Math.ceil((dur / 60) * pricePerHour);

  const user = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  if (user.balance < total)
    return res.status(400).json({
      success: false,
      message: `Saldo tidak cukup. Butuh: Rp ${total.toLocaleString('id-ID')}, Saldo: Rp ${user.balance.toLocaleString('id-ID')}`
    });

  const bookingId = uuidv4();
  run(`INSERT INTO bookings (id,user_id,tutor_id,subject,mode,scheduled_at,duration_minutes,total_price,notes)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [bookingId, req.user.id, tutor.id, subject, mode || 'online', scheduled_at, dur, total, notes || '']);

  // Deduct wallet
  run('UPDATE users SET balance = balance - ? WHERE id = ?', [total, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', total, `Sesi Tutor: ${tutor.name} — ${subject}`, bookingId]);

  // Update tutor stats
  run('UPDATE tutors SET total_sessions = total_sessions + 1 WHERE id = ?', [tutor.id]);

  run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'Booking Tutor Berhasil! 👨‍🏫',
     `Sesi dengan ${tutor.name} untuk ${subject} pada ${scheduled_at} berhasil di-booking.`, 'booking']);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Booking sesi dengan ${tutor.name} berhasil!`,
    booking_id: bookingId,
    total,
    balance: updated.balance
  });
});

// GET /api/tutors/my/bookings
router.get('/my/bookings', authMiddleware, (req, res) => {
  const bookings = query(`
    SELECT b.*, t.name as tutor_name, t.avatar as tutor_avatar, t.subjects as tutor_subjects
    FROM bookings b JOIN tutors t ON b.tutor_id = t.id
    WHERE b.user_id = ? ORDER BY b.scheduled_at DESC`, [req.user.id]);
  res.json({ success: true, bookings });
});

// PUT /api/tutors/bookings/:id/cancel
router.put('/bookings/:id/cancel', authMiddleware, (req, res) => {
  const booking = queryOne('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });
  if (booking.status !== 'pending')
    return res.status(400).json({ success: false, message: 'Booking tidak dapat dibatalkan.' });

  run(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [req.params.id]);

  // Refund
  run('UPDATE users SET balance = balance + ? WHERE id = ?', [booking.total_price, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'credit', booking.total_price, `Refund Pembatalan Booking`, booking.id]);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Booking dibatalkan. Refund Rp ${booking.total_price.toLocaleString('id-ID')} berhasil.`,
    balance: updated.balance
  });
});

// POST /api/tutors (admin)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { name, subjects, bio, rate_per_hour, education, availability, avatar } = req.body;
  if (!name || !subjects || !rate_per_hour)
    return res.status(400).json({ success: false, message: 'Nama, mata pelajaran, dan tarif wajib diisi.' });

  const id = uuidv4();
  run(`INSERT INTO tutors (id,name,subjects,bio,rate_per_hour,education,availability,avatar) VALUES (?,?,?,?,?,?,?,?)`,
    [id, name, subjects, bio || '', rate_per_hour, education || '', availability || 'online', avatar || '👨‍🏫']);

  res.status(201).json({ success: true, message: 'Tutor berhasil ditambahkan.', id });
});

module.exports = router;
