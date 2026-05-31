const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Question banks
const QUESTIONS = {
  math: [
    { q: 'Berapa hasil dari 17 × 8?', options: ['126','136','144','152'], answer: '136' },
    { q: 'Akar kuadrat dari 144 adalah?', options: ['10','11','12','13'], answer: '12' },
    { q: 'Berapa nilai π (pi) yang paling tepat?', options: ['3.12','3.14','3.16','3.18'], answer: '3.14' },
    { q: 'Jika 3x + 9 = 30, maka x = ?', options: ['5','6','7','8'], answer: '7' },
    { q: 'Berapakah FPB dari 24 dan 36?', options: ['6','8','10','12'], answer: '12' },
    { q: 'Luas persegi dengan sisi 7 cm adalah?', options: ['14 cm²','28 cm²','42 cm²','49 cm²'], answer: '49 cm²' },
    { q: 'Hasil dari 2⁸ adalah?', options: ['128','256','512','64'], answer: '256' },
    { q: 'Jika log₂(x) = 5, maka x = ?', options: ['10','16','25','32'], answer: '32' },
    { q: 'Turunan dari f(x) = 3x² + 2x adalah?', options: ['3x+2','6x+2','6x+4','3x+4'], answer: '6x+2' },
    { q: 'Nilai sin 30° adalah?', options: ['½','√2/2','√3/2','1'], answer: '½' },
  ],
  language: [
    { q: 'What is the plural of "child"?', options: ['childs','childes','children','childrens'], answer: 'children' },
    { q: 'Kata "ephemeral" berarti?', options: ['Permanen','Sementara','Abadi','Kuat'], answer: 'Sementara' },
    { q: 'Which is the correct sentence?', options: ['He go to school','He goes to school','He going to school','He gone to school'], answer: 'He goes to school' },
    { q: 'Antonim dari kata "loquacious" adalah?', options: ['Cerewet','Pendiam','Ramah','Keras'], answer: 'Pendiam' },
    { q: 'Passive voice: "She writes a letter" becomes?', options: ['A letter is written by her','A letter was written by her','A letter wrote by her','A letter has written by her'], answer: 'A letter is written by her' },
  ],
  logic: [
    { q: 'Lanjutan pola: 2, 4, 8, 16, ...', options: ['24','28','32','36'], answer: '32' },
    { q: 'Jika KUCING = 11, maka ANJING = ?', options: ['13','14','15','16'], answer: '14' },
    { q: 'Lanjutan: A, C, E, G, ...', options: ['H','I','J','K'], answer: 'I' },
    { q: 'Pola: 1, 1, 2, 3, 5, 8, ...', options: ['11','12','13','14'], answer: '13' },
    { q: 'Jika 5 orang dapat menyelesaikan pekerjaan dalam 6 hari, berapa hari untuk 10 orang?', options: ['2','3','4','5'], answer: '3' },
  ]
};

// GET /api/games - list all games
router.get('/', optionalAuth, (req, res) => {
  const games = query('SELECT * FROM games WHERE is_active = 1');

  // Add live player counts (simulated)
  const enriched = games.map(g => ({
    ...g,
    live_players: Math.floor(Math.random() * 400) + 50,
  }));

  res.json({ success: true, games: enriched });
});

// GET /api/games/questions/:category - get questions
router.get('/questions/:category', authMiddleware, (req, res) => {
  const cat = req.params.category;
  const bank = QUESTIONS[cat] || QUESTIONS.math;
  // Shuffle and return 5 questions (without answers)
  const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, 5);
  const questions = shuffled.map(q => ({ question: q.q, options: q.options }));
  // Store answers in session-like way (we'll validate in submit)
  res.json({ success: true, questions, session_key: Buffer.from(JSON.stringify(shuffled.map(q => q.answer))).toString('base64') });
});

// POST /api/games/submit - submit answers and calculate score
router.post('/submit', authMiddleware, (req, res) => {
  const { game_id, answers, session_key, duration_seconds } = req.body;

  if (!answers || !session_key)
    return res.status(400).json({ success: false, message: 'Data submission tidak lengkap.' });

  let correctAnswers;
  try {
    correctAnswers = JSON.parse(Buffer.from(session_key, 'base64').toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Session tidak valid.' });
  }

  // Calculate score
  let correct = 0;
  const results = answers.map((ans, i) => {
    const isCorrect = ans === correctAnswers[i];
    if (isCorrect) correct++;
    return { answer: ans, correct_answer: correctAnswers[i], is_correct: isCorrect };
  });

  const score = Math.round((correct / correctAnswers.length) * 100);
  const timeBonusFactor = Math.max(0.5, 1 - (duration_seconds / 300));
  const pointsEarned = Math.round(correct * 100 * timeBonusFactor);

  // Save session
  const sessionId = uuidv4();
  run(`INSERT INTO game_sessions (id,user_id,game_id,score,points_earned,duration_seconds) VALUES (?,?,?,?,?,?)`,
    [sessionId, req.user.id, game_id || 'unknown', score, pointsEarned, duration_seconds || 0]);

  // Award points
  run('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, req.user.id]);

  // Update leaderboard
  const lb = queryOne(`SELECT * FROM leaderboard WHERE user_id = ? AND period = 'weekly'`, [req.user.id]);
  if (lb) {
    run(`UPDATE leaderboard SET total_points = total_points + ?, updated_at = datetime('now') WHERE user_id = ? AND period = 'weekly'`,
      [pointsEarned, req.user.id]);
  } else {
    run(`INSERT INTO leaderboard (id,user_id,period,total_points) VALUES (?,?,'weekly',?)`,
      [uuidv4(), req.user.id, pointsEarned]);
  }

  // Reward if score >= 80
  let reward = null;
  if (score >= 80) {
    const voucherAmount = score >= 100 ? 25000 : score >= 90 ? 15000 : 10000;
    run('UPDATE users SET balance = balance + ? WHERE id = ?', [voucherAmount, req.user.id]);
    run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
      [uuidv4(), req.user.id, 'credit', voucherAmount, `Reward Game — Skor ${score}`, sessionId]);
    reward = { type: 'voucher', amount: voucherAmount };

    run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.user.id, `Keren! Skor ${score}! 🎉`,
       `Kamu mendapat reward Rp ${voucherAmount.toLocaleString('id-ID')} + ${pointsEarned} poin.`, 'achievement']);
  }

  const updated = queryOne('SELECT balance, points FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    score,
    correct,
    total: correctAnswers.length,
    points_earned: pointsEarned,
    results,
    reward,
    balance: updated.balance,
    total_points: updated.points
  });
});

// GET /api/games/leaderboard
router.get('/leaderboard', optionalAuth, (req, res) => {
  const { period = 'weekly', limit = 10 } = req.query;

  const boards = query(`
    SELECT l.*, u.name, u.avatar
    FROM leaderboard l JOIN users u ON l.user_id = u.id
    WHERE l.period = ?
    ORDER BY l.total_points DESC
    LIMIT ?`, [period, Number(limit)]);

  // Rank them
  const ranked = boards.map((row, i) => ({ ...row, rank: i + 1 }));

  let myRank = null;
  if (req.user) {
    const myEntry = queryOne(
      `SELECT l.*, u.name FROM leaderboard l JOIN users u ON l.user_id = u.id WHERE l.user_id = ? AND l.period = ?`,
      [req.user.id, period]);
    if (myEntry) {
      const pos = ranked.findIndex(r => r.user_id === req.user.id);
      myRank = { ...myEntry, rank: pos >= 0 ? pos + 1 : '10+' };
    }
  }

  res.json({ success: true, leaderboard: ranked, my_rank: myRank });
});

// GET /api/games/history
router.get('/history', authMiddleware, (req, res) => {
  const sessions = query(`
    SELECT gs.*, g.name as game_name
    FROM game_sessions gs LEFT JOIN games g ON gs.game_id = g.id
    WHERE gs.user_id = ?
    ORDER BY gs.played_at DESC LIMIT 20`, [req.user.id]);
  res.json({ success: true, sessions });
});

module.exports = router;
