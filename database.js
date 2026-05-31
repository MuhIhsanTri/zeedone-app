const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.PROJECT_DOMAIN ? '/app/.data/zeedone.sqlite' : path.join(__dirname, 'zeedone.sqlite');
let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  seedData();
  saveDB();
  console.log('[DB] Database initialized ✓');
  return db;
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      avatar TEXT,
      balance REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      thumbnail TEXT,
      instructor_id TEXT,
      total_lessons INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      level TEXT DEFAULT 'Semua Level',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      progress REAL DEFAULT 0,
      enrolled_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      reference_id TEXT,
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      total_sold INTEGER DEFAULT 0,
      thumbnail TEXT,
      is_ebook INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutors (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      subjects TEXT NOT NULL,
      bio TEXT,
      rate_per_hour REAL NOT NULL,
      rating REAL DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      education TEXT,
      availability TEXT DEFAULT 'online',
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tutor_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      mode TEXT DEFAULT 'online',
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      reward_points INTEGER DEFAULT 0,
      max_players INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      points_earned INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      played_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT,
      period TEXT DEFAULT 'weekly',
      total_points INTEGER DEFAULT 0,
      rank INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedData() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const countResult = db.exec("SELECT COUNT(*) as c FROM users");
  const count = countResult[0]?.values[0][0];
  if (count > 0) return;

  console.log('[DB] Seeding initial data...');
  const hash = bcrypt.hashSync('zeedone123', 10);
  const adminId = uuidv4();
  const userId1 = uuidv4();

  // Users
  db.run(`INSERT INTO users (id,name,email,phone,password_hash,role,balance,points) VALUES
    ('${adminId}','Admin Zeedone','admin@zeedone.id','+6281234567890','${hash}','admin',1000000,9999),
    ('${userId1}','Pengguna Demo','demo@zeedone.id','+6285678901234','${hash}','student',285000,4250)
  `);

  // Courses
  const courses = [
    [uuidv4(),'Aljabar Lanjutan SMA','Matematika','Materi lengkap aljabar untuk persiapan SNBT dan ujian nasional',75000,120000,'📐',adminId,24,480,4.8,2340,'SMA'],
    [uuidv4(),'Mekanika Klasik','Fisika','Dari gerak lurus hingga rotasi benda tegar secara komprehensif',85000,150000,'🔬',adminId,18,360,4.7,1820,'SMA'],
    [uuidv4(),'Kimia Organik Dasar','Kimia','Struktur molekul, reaksi kimia, dan aplikasinya',90000,130000,'🧪',adminId,20,400,4.9,3100,'SMA'],
    [uuidv4(),'Bahasa Inggris TOEFL Prep','Bahasa','Persiapan TOEFL lengkap: Reading, Listening, Writing, Speaking',120000,200000,'🌎',adminId,32,640,4.6,5200,'Semua'],
    [uuidv4(),'Biologi Sel & Genetika','Biologi','Biologi molekuler, genetika Mendel dan modern',80000,110000,'🧬',adminId,16,320,4.8,1950,'SMA'],
    [uuidv4(),'Statistika & Probabilitas','Matematika','Statistika deskriptif dan inferensial, peluang dan distribusi',70000,100000,'📊',adminId,20,400,4.7,1600,'SMA/Kuliah'],
    [uuidv4(),'Pemrograman Python Dasar','Teknologi','Belajar Python dari nol: variabel, fungsi, OOP, dan proyek mini',95000,150000,'🐍',adminId,28,560,4.9,4100,'Umum'],
    [uuidv4(),'Akuntansi Dasar','IPS','Laporan keuangan, jurnal umum, neraca, dan laporan laba rugi',65000,90000,'📋',adminId,22,440,4.5,1200,'SMA/Kuliah'],
  ];

  courses.forEach(c => {
    db.run(`INSERT INTO courses (id,title,subject,description,price,original_price,thumbnail,instructor_id,total_lessons,duration_minutes,rating,total_students,level)
      VALUES ('${c[0]}','${c[1]}','${c[2]}','${c[3]}',${c[4]},${c[5]},'${c[6]}','${c[7]}',${c[8]},${c[9]},${c[10]},${c[11]},'${c[12]}')`);
  });

  // Enrollments for demo user
  const firstCourseResult = db.exec("SELECT id FROM courses LIMIT 2");
  if (firstCourseResult[0]) {
    firstCourseResult[0].values.forEach((row, i) => {
      db.run(`INSERT OR IGNORE INTO enrollments (id,user_id,course_id,progress) VALUES ('${uuidv4()}','${userId1}','${row[0]}',${i === 0 ? 65 : 30})`);
    });
  }

  // Products
  const products = [
    [uuidv4(),'Buku Matematika Kelas 12 K-Merdeka','Buku Fisik','Buku pelajaran matematika kurikulum merdeka terbaru',89000,120000,50,4.8,234,0],
    [uuidv4(),'E-Book Fisika Kuantum Modern','E-Book','Pengantar fisika kuantum untuk pelajar SMA dan mahasiswa',45000,null,999,4.7,456,1],
    [uuidv4(),'Paket SNBT 2025 Lengkap','Paket Belajar','Buku soal + pembahasan lengkap semua mata pelajaran SNBT',185000,250000,30,4.9,789,0],
    [uuidv4(),'Modul Soal Kimia 1000+ Latihan','Modul Soal','Kumpulan soal latihan kimia dengan pembahasan detail',55000,null,100,4.6,321,0],
    [uuidv4(),'Buku Biologi Lengkap SMA','Buku Fisik','Biologi SMA kelas X-XII kurikulum merdeka',95000,130000,25,4.7,145,0],
    [uuidv4(),'E-Book Bahasa Inggris IELTS','E-Book','Panduan lengkap persiapan IELTS band 7+',65000,null,999,4.8,567,1],
  ];

  products.forEach(p => {
    db.run(`INSERT INTO products (id,title,category,description,price,original_price,stock,rating,total_sold,is_ebook)
      VALUES ('${p[0]}','${p[1]}','${p[2]}','${p[3]}',${p[4]},${p[5] ?? 'NULL'},${p[6]},${p[7]},${p[8]},${p[9]})`);
  });

  // Tutors
  const tutors = [
    [uuidv4(),'Dr. Ahmad Fauzi, M.Pd','Matematika,Fisika','Doktor pendidikan matematika, 10 tahun pengalaman mengajar',85000,4.9,320,280,'S3 Pendidikan Matematika - UGM','online','👨‍🏫'],
    [uuidv4(),'Ibu Sari Dewi, S.Pd','Kimia,Biologi','Guru SMA berpengalaman, alumni UNAIR jurusan kimia',70000,4.8,215,190,'S1 Kimia - UNAIR','both','👩‍🏫'],
    [uuidv4(),'Kak Rendi Pratama','Bahasa Inggris,TOEFL,IELTS','Native-level English, TOEFL score 650+, ex-British Council',100000,5.0,450,400,'S1 Sastra Inggris - UI','online','🧑‍💻'],
    [uuidv4(),'Prof. Hendra Wijaya','Statistika,Akuntansi,Ekonomi','Profesor ekonomi, konsultan keuangan berpengalaman',120000,4.7,180,160,'S3 Ekonomi - UNESA','offline','👨‍🔬'],
    [uuidv4(),'Kak Dina Maharani','Biologi,Kimia,IPA','Lulusan terbaik FK UNAIR, spesialis IPA SMP-SMA',75000,4.8,240,200,'S1 Kedokteran - UNAIR','both','👩‍⚕️'],
  ];

  tutors.forEach(t => {
    db.run(`INSERT INTO tutors (id,name,subjects,bio,rate_per_hour,rating,total_sessions,total_students,education,availability,avatar)
      VALUES ('${t[0]}','${t[1]}','${t[2]}','${t[3]}',${t[4]},${t[5]},${t[6]},${t[7]},'${t[8]}','${t[9]}','${t[10]}')`);
  });

  // Games
  const games = [
    [uuidv4(),'Quiz Matematika','math','Jawab soal matematika dalam waktu terbatas',100,1],
    [uuidv4(),'Tebak Angka','math','Tebak angka yang benar dalam 5 detik!',50,1],
    [uuidv4(),'Word Scramble','language','Susun huruf acak menjadi kata yang benar',75,1],
    [uuidv4(),'IQ Challenge','logic','Uji kemampuan logika dan pola pikir',150,1],
  ];

  games.forEach(g => {
    db.run(`INSERT INTO games (id,name,category,description,reward_points,max_players) VALUES ('${g[0]}','${g[1]}','${g[2]}','${g[3]}',${g[4]},${g[5]})`);
  });

  // Leaderboard seed
  const lb = [
    [uuidv4(),'Rizky Nanda','weekly',8450,1],
    [uuidv4(),'Siti Fatimah','weekly',7200,2],
    [uuidv4(),'Budi Wicaksono','weekly',6800,3],
  ];
  lb.forEach(l => {
    const uid = uuidv4();
    db.run(`INSERT OR IGNORE INTO users (id,name,email,password_hash,balance,points) VALUES ('${uid}','${l[1]}','${l[1].replace(' ','').toLowerCase()}@zeedone.id','${hash}',0,${l[3]})`);
    db.run(`INSERT INTO leaderboard (id,user_id,period,total_points,rank) VALUES ('${l[0]}','${uid}','${l[2]}',${l[3]},${l[4]})`);
  });

  // Wallet transactions for demo user
  const txs = [
    [uuidv4(),userId1,'credit',100000,'Top Up via BCA','BCA-001'],
    [uuidv4(),userId1,'debit',75000,'Berlangganan Kelas Matematika','COURSE-001'],
    [uuidv4(),userId1,'credit',25000,'Reward Quiz Matematika','GAME-001'],
    [uuidv4(),userId1,'debit',89000,'Beli Buku: Fisika Kuantum','ORDER-001'],
    [uuidv4(),userId1,'debit',150000,'Sesi Tutor Privat - Dr. Ahmad','BOOK-001'],
    [uuidv4(),userId1,'credit',200000,'Top Up via Mandiri','MANDIRI-001'],
  ];
  txs.forEach(t => {
    db.run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES ('${t[0]}','${t[1]}','${t[2]}',${t[3]},'${t[4]}','${t[5]}')`);
  });

  // Notifications
  const notifs = [
    [uuidv4(),userId1,'Selamat datang di Zeedone! 🎉','Mulai belajar dan raih impianmu bersama kami.','welcome'],
    [uuidv4(),userId1,'Top Up Berhasil 💰','Saldo Rp 100.000 berhasil ditambahkan ke e-wallet kamu.','transaction'],
    [uuidv4(),userId1,'Kamu masuk Top 10 Leaderboard! 🏆','Pertahankan posisimu dan menangkan hadiah mingguan.','achievement'],
  ];
  notifs.forEach(n => {
    db.run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES ('${n[0]}','${n[1]}','${n[2]}','${n[3]}','${n[4]}')`);
  });

  saveDB();
  console.log('[DB] Seed data completed ✓');
}

// --- Query helpers ---
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.getAsObject ? null : null;
    const rows = [];
    stmt.bind(params);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('[DB] query error:', e.message, sql);
    return [];
  }
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDB();
    return { changes: 1 };
  } catch (e) {
    console.error('[DB] run error:', e.message);
    throw e;
  }
}

function getDB() { return db; }

module.exports = { initDB, query, queryOne, run, saveDB };
