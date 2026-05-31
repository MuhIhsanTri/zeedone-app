const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/wallet/balance
router.get('/balance', authMiddleware, (req, res) => {
  const user = queryOne('SELECT balance, points FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, balance: user.balance, points: user.points });
});

// POST /api/wallet/topup
router.post('/topup', authMiddleware, (req, res) => {
  const { amount, payment_method } = req.body;
  const amt = Number(amount);

  if (!amt || amt < 10000)
    return res.status(400).json({ success: false, message: 'Minimum top up Rp 10.000.' });
  if (amt > 10000000)
    return res.status(400).json({ success: false, message: 'Maksimum top up Rp 10.000.000 per transaksi.' });

  const refId = `TOPUP-${Date.now()}`;
  run('UPDATE users SET balance = balance + ? WHERE id = ?', [amt, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'credit', amt, `Top Up via ${payment_method || 'Transfer Bank'}`, refId]);

  run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'Top Up Berhasil 💰',
     `Saldo Rp ${amt.toLocaleString('id-ID')} berhasil ditambahkan.`, 'transaction']);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Top up Rp ${amt.toLocaleString('id-ID')} berhasil!`,
    balance: updated.balance,
    reference_id: refId
  });
});

// POST /api/wallet/transfer
router.post('/transfer', authMiddleware, (req, res) => {
  const { to_email, amount, note } = req.body;
  const amt = Number(amount);

  if (!to_email || !amt)
    return res.status(400).json({ success: false, message: 'Email tujuan dan jumlah wajib diisi.' });
  if (amt < 1000)
    return res.status(400).json({ success: false, message: 'Minimum transfer Rp 1.000.' });

  const sender = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (sender.balance < amt)
    return res.status(400).json({ success: false, message: 'Saldo tidak cukup.' });

  const receiver = queryOne('SELECT * FROM users WHERE email = ?', [to_email]);
  if (!receiver)
    return res.status(404).json({ success: false, message: 'Pengguna tujuan tidak ditemukan.' });
  if (receiver.id === req.user.id)
    return res.status(400).json({ success: false, message: 'Tidak bisa transfer ke diri sendiri.' });

  const refId = `TRF-${Date.now()}`;
  run('UPDATE users SET balance = balance - ? WHERE id = ?', [amt, req.user.id]);
  run('UPDATE users SET balance = balance + ? WHERE id = ?', [amt, receiver.id]);

  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', amt, `Transfer ke ${receiver.name}${note ? ': ' + note : ''}`, refId]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), receiver.id, 'credit', amt, `Menerima transfer dari ${sender.name}${note ? ': ' + note : ''}`, refId]);

  run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
    [uuidv4(), receiver.id, `Kamu menerima transfer! 💸`,
     `${sender.name} mengirim Rp ${amt.toLocaleString('id-ID')} ke akunmu.`, 'transaction']);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Transfer Rp ${amt.toLocaleString('id-ID')} ke ${receiver.name} berhasil!`,
    balance: updated.balance
  });
});

// POST /api/wallet/withdraw
router.post('/withdraw', authMiddleware, (req, res) => {
  const { amount, bank_name, account_number, account_name } = req.body;
  const amt = Number(amount);

  if (!amt || !bank_name || !account_number || !account_name)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
  if (amt < 50000)
    return res.status(400).json({ success: false, message: 'Minimum tarik tunai Rp 50.000.' });

  const user = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  if (user.balance < amt)
    return res.status(400).json({ success: false, message: 'Saldo tidak cukup.' });

  const refId = `WD-${Date.now()}`;
  run('UPDATE users SET balance = balance - ? WHERE id = ?', [amt, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id,status) VALUES (?,?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', amt,
     `Tarik Tunai ke ${bank_name} a.n. ${account_name} (${account_number})`, refId, 'pending']);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Permintaan tarik Rp ${amt.toLocaleString('id-ID')} sedang diproses (1x24 jam kerja).`,
    balance: updated.balance,
    reference_id: refId
  });
});

// GET /api/wallet/transactions
router.get('/transactions', authMiddleware, (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;
  let sql = `SELECT * FROM wallet_transactions WHERE user_id = ?`;
  const params = [req.user.id];

  if (type) { sql += ` AND type = ?`; params.push(type); }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const txs = query(sql, params);
  const summary = queryOne(
    `SELECT SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) as total_in,
            SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END) as total_out
     FROM wallet_transactions WHERE user_id = ?`, [req.user.id]);

  res.json({
    success: true,
    summary: {
      total_in: summary?.total_in || 0,
      total_out: summary?.total_out || 0,
    },
    transactions: txs
  });
});

// POST /api/wallet/pay - generic payment (used by other modules)
router.post('/pay', authMiddleware, (req, res) => {
  const { amount, description, reference_id } = req.body;
  const amt = Number(amount);

  if (!amt || !description) return res.status(400).json({ success: false, message: 'Data pembayaran tidak lengkap.' });

  const user = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  if (user.balance < amt)
    return res.status(400).json({ success: false, message: `Saldo tidak cukup. Saldo kamu: Rp ${user.balance.toLocaleString('id-ID')}` });

  run('UPDATE users SET balance = balance - ? WHERE id = ?', [amt, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', amt, description, reference_id || `PAY-${Date.now()}`]);

  const updated = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, message: 'Pembayaran berhasil.', balance: updated.balance });
});

module.exports = router;
