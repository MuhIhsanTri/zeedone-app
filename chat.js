const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// POST /api/chat/send
router.post('/send', authMiddleware, (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim())
    return res.status(400).json({ success: false, message: 'Penerima dan isi pesan wajib diisi.' });

  const receiver = queryOne('SELECT id, name FROM users WHERE id = ?', [receiver_id]);
  if (!receiver) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });

  const id = uuidv4();
  run(`INSERT INTO messages (id,sender_id,receiver_id,content) VALUES (?,?,?,?)`,
    [id, req.user.id, receiver_id, content.trim()]);

  res.json({ success: true, message_id: id, sent_at: new Date().toISOString() });
});

// GET /api/chat/conversation/:userId
router.get('/conversation/:userId', authMiddleware, (req, res) => {
  const messages = query(`
    SELECT m.*, u.name as sender_name
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC LIMIT 50`,
    [req.user.id, req.params.userId, req.params.userId, req.user.id]);

  // Mark as read
  run(`UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?`,
    [req.user.id, req.params.userId]);

  res.json({ success: true, messages });
});

// GET /api/chat/inbox
router.get('/inbox', authMiddleware, (req, res) => {
  const conversations = query(`
    SELECT DISTINCT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
      u.name as other_user_name,
      (SELECT content FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY u.id
    ORDER BY last_message_at DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

  res.json({ success: true, conversations });
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────
// GET /api/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const notifs = query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, Number(limit), Number(offset)]);
  const unread = queryOne(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0`, [req.user.id]);
  res.json({ success: true, unread_count: unread?.c || 0, notifications: notifs });
});

// PUT /api/notifications/read-all
router.put('/notifications/read-all', authMiddleware, (req, res) => {
  run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
  res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
});

// PUT /api/notifications/:id/read
router.put('/notifications/:id/read', authMiddleware, (req, res) => {
  run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
