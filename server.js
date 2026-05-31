require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static frontend ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/wallet',  require('./routes/wallet'));
app.use('/api/shop',    require('./routes/shop'));
app.use('/api/tutors',  require('./routes/tutors'));
app.use('/api/games',   require('./routes/games'));
app.use('/api',         require('./routes/chat'));   // chat + notifications

// ─── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Zeedone API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────
// Menggunakan awalan '/api' tanpa simbol bintang
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.` });
});

// ─── SPA Fallback ───────────────────────────────────────────────────
// Dikosongkan (tanpa rute string) agar otomatis menangkap semua URL yang tersisa
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
});

// ─── Boot ───────────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║         🎓 ZEEDONE BACKEND API             ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║  Server    : http://localhost:${PORT}          ║`);
      console.log(`║  API Base  : http://localhost:${PORT}/api      ║`);
      console.log(`║  Frontend  : http://localhost:${PORT}          ║`);
      console.log('╠════════════════════════════════════════════╣');
      console.log('║  Demo Login:                               ║');
      console.log('║  Email    : demo@zeedone.id                ║');
      console.log('║  Password : zeedone123                     ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log('║  Admin Login:                              ║');
      console.log('║  Email    : admin@zeedone.id               ║');
      console.log('║  Password : zeedone123                     ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('[FATAL] Gagal start server:', err);
    process.exit(1);
  }
}

start();
