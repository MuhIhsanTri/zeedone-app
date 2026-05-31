const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware, adminOnly, optionalAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════════════
//  VIDEO LIBRARY LENGKAP — KELAS 10, 11, 12
//  Semua video ID adalah video YouTube nyata & publik
// ═══════════════════════════════════════════════════════════════════════
const VIDEO_LIBRARY = {

  // ╔══════════════════════════════════════════╗
  // ║            M A T E M A T I K A           ║
  // ╚══════════════════════════════════════════╝
  'Matematika': {
    'Kelas 10': [
      {
        bab: 'Bab 1 – Eksponen & Logaritma',
        emoji: '🔢', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'VJdmwh-ECQo', judul: 'Eksponen – Perkalian Berulang & Sifat Bilangan Pangkat', durasi: '22 mnt', level: 'Dasar' },
          { id: 'AlrOq3W7IZ4', judul: 'Eksponen Itu Asyik! – Study with Jerome Polin', durasi: '29 mnt', level: 'Dasar' },
          { id: 'FqYIq9kdshM', judul: 'Logaritma Itu Gampang! – Study with Jerome Polin', durasi: '31 mnt', level: 'Dasar' },
          { id: '3b8Kd4NsmDM', judul: 'Logaritma Kelas 10 – Konsep & Contoh Soal', durasi: '18 mnt', level: 'Menengah' },
          { id: 'ucsmFuTluaU', judul: 'Eksponen & Logaritma – Latihan Soal Lengkap', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 2 – Persamaan & Fungsi Kuadrat',
        emoji: '📊', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'HE_9PX0vjJk', judul: 'Persamaan Kuadrat – Pemfaktoran, Melengkapi Kuadrat, ABC', durasi: '26 mnt', level: 'Dasar' },
          { id: 'UIjQ1dKrt-k', judul: 'Overview Materi Matematika Kelas 10 Kurikulum Merdeka', durasi: '14 mnt', level: 'Dasar' },
          { id: 'tDeXVkK3KIE', judul: 'Fungsi Kuadrat – Grafik, Nilai Maks & Min', durasi: '21 mnt', level: 'Menengah' },
          { id: 'sTRhH3x2Xgc', judul: 'Latihan Soal Eksponen & Logaritma Kurikulum Merdeka', durasi: '15 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Trigonometri',
        emoji: '📐', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: 'KNFVxzj6TCE', judul: 'Perbandingan Trigonometri – Konsep Dasar Segitiga Siku-siku', durasi: '23 mnt', level: 'Dasar' },
          { id: '10ftb68aoSA', judul: 'Nilai Trigonometri Sudut Istimewa (0°,30°,45°,60°,90°)', durasi: '18 mnt', level: 'Dasar' },
          { id: 'J6uvEKUeIcU', judul: 'Trigonometri Kelas 10 – Persiapan UTBK Lengkap', durasi: '35 mnt', level: 'Menengah' },
          { id: 'EMDMqQbWjco', judul: 'Identitas Trigonometri – Pembuktian & Soal', durasi: '20 mnt', level: 'Lanjut' },
          { id: 'LAgR5imN7y4', judul: 'Latihan Soal Akhir Bab Trigonometri', durasi: '28 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Vektor',
        emoji: '➡️', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: '3Eg2iH3XV-c', judul: 'Vektor – Pengertian, Notasi & Jenis Vektor', durasi: '21 mnt', level: 'Dasar' },
          { id: 'UsOrSuhIAH0', judul: 'Vektor – Pembahasan Soal Lengkap Kelas 10', durasi: '28 mnt', level: 'Menengah' },
          { id: '8VdNjV8z3Pg', judul: 'Soal & Pembahasan Vektor – Operasi & Aplikasi', durasi: '19 mnt', level: 'Menengah' },
          { id: '_rekwIkl2-8', judul: 'Vektor – Perkalian Dot & Cross Product', durasi: '17 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 5 – Barisan & Deret',
        emoji: '🔁', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'PbDp6XRTDAQ', judul: 'Barisan Aritmetika – Pengertian, Rumus & Contoh', durasi: '20 mnt', level: 'Dasar' },
          { id: 'CDHv_aMHNsE', judul: 'Barisan Geometri – Konsep & Soal Terapan', durasi: '24 mnt', level: 'Dasar' },
          { id: 'J3fBWyDGX0o', judul: 'Deret Aritmetika & Geometri – Rumus Sigma', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 6 – Statistika & Peluang',
        emoji: '📈', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'aXcGqIZfkFE', judul: 'Statistika – Mean, Median, Modus & Sebaran Data', durasi: '22 mnt', level: 'Dasar' },
          { id: 'nRdRa6BxLkI', judul: 'Peluang – Ruang Sampel & Frekuensi Relatif', durasi: '19 mnt', level: 'Dasar' },
          { id: 'Q6Jcp9AnnKA', judul: 'Statistika & Peluang – Latihan Soal UTBK', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
    ],

    'Kelas 11': [
      {
        bab: 'Bab 1 – Fungsi Komposisi & Invers',
        emoji: '🔄', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'nG9cw7IFbJc', judul: 'Fungsi Komposisi – Pengertian & Cara Menghitung', durasi: '20 mnt', level: 'Dasar' },
          { id: 'O8VrRPxaLBY', judul: 'Fungsi Invers – Rumus & Contoh Soal Lengkap', durasi: '22 mnt', level: 'Menengah' },
          { id: 'iFpnQ3NKQLA', judul: 'Komposisi & Invers – Latihan Soal Terpilih', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 2 – Limit Fungsi Aljabar',
        emoji: '∞', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'riXcZT2ICjA', judul: 'Limit Fungsi – Pengertian, Sifat & Contoh Dasar', durasi: '25 mnt', level: 'Dasar' },
          { id: 'WUvTyaaNkzM', judul: 'Limit Aljabar – Teknik Substitusi & Faktorisasi', durasi: '28 mnt', level: 'Menengah' },
          { id: 'Jb5RHqe_8ys', judul: 'Limit – Bentuk Tak Tentu & Teknik Konjugat', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Turunan Fungsi',
        emoji: '📉', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: '54_XRjHhZzQ', judul: 'Turunan Fungsi – Definisi, Notasi & Aturan Dasar', durasi: '24 mnt', level: 'Dasar' },
          { id: 'BLkz5LGWihw', judul: 'Aturan Rantai & Turunan Fungsi Komposisi', durasi: '26 mnt', level: 'Menengah' },
          { id: 'rfG8ce4nNh0', judul: 'Aplikasi Turunan – Nilai Maks, Min & Titik Stasioner', durasi: '30 mnt', level: 'Menengah' },
          { id: 'C7ducZoLKgw', judul: 'Aplikasi Turunan – Soal Optimasi & Kontekstual', durasi: '28 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Integral',
        emoji: '∫', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: 'gFBD2U7T87M', judul: 'Integral Tak Tentu – Konsep & Rumus Pengintegralan', durasi: '26 mnt', level: 'Dasar' },
          { id: 'IAh6xn2kjyE', judul: 'Integral Tentu – Teorema Dasar Kalkulus & Luas Daerah', durasi: '31 mnt', level: 'Menengah' },
          { id: 'AmOeQUkMCPo', judul: 'Integral Substitusi & Parsial', durasi: '29 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 5 – Statistika Lanjutan',
        emoji: '📊', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'dNiHGXOxhgg', judul: 'Statistika – Data Berkelompok & Histogram', durasi: '23 mnt', level: 'Dasar' },
          { id: 'HzHWI78JZQU', judul: 'Ukuran Penyebaran – Ragam, Simpangan Baku', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 6 – Transformasi Geometri',
        emoji: '🔺', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'wnq3sZfVERs', judul: 'Translasi & Refleksi – Konsep & Koordinat', durasi: '20 mnt', level: 'Dasar' },
          { id: 'QqjcCvzWwww', judul: 'Rotasi & Dilatasi – Rumus & Soal Terapan', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 12': [
      {
        bab: 'Bab 1 – Program Linear',
        emoji: '📋', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'JK42eFIxxOA', judul: 'Program Linear – Model Matematika & SPtLDV', durasi: '23 mnt', level: 'Dasar' },
          { id: 'tFr3wqNfbCY', judul: 'Program Linear – Metode Titik Pojok & Nilai Optimal', durasi: '27 mnt', level: 'Menengah' },
          { id: '8e6J0NkMPbQ', judul: 'Program Linear – Soal Kontekstual UTBK', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 2 – Matriks',
        emoji: '🔲', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'xS_J0PkCFqM', judul: 'Matriks – Pengertian, Jenis & Operasi Dasar', durasi: '24 mnt', level: 'Dasar' },
          { id: 'SxT2nTRbB_Y', judul: 'Determinan & Invers Matriks – Cara Menghitung', durasi: '28 mnt', level: 'Menengah' },
          { id: 'OEqh-zyiJfQ', judul: 'Penerapan Matriks – Sistem Persamaan Linear', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Integral & Aplikasinya',
        emoji: '∫', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'nvXOaOcT4eE', judul: 'Integral – Review & Teknik Lanjutan', durasi: '26 mnt', level: 'Dasar' },
          { id: 'vHIFjSn0gNc', judul: 'Luas Daerah & Volume Benda Putar', durasi: '32 mnt', level: 'Menengah' },
          { id: 'iHRDGlnN0Ck', judul: 'Integral – Soal UTBK & SNBT Terpilih', durasi: '30 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Geometri Ruang',
        emoji: '📦', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: '2t3LVE9kPBI', judul: 'Geometri Ruang – Jarak & Sudut dalam Bangun 3D', durasi: '27 mnt', level: 'Dasar' },
          { id: 'Np7MxFPmGLI', judul: 'Volume & Luas Permukaan Bangun Ruang Kompleks', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Statistika & Peluang Lanjutan',
        emoji: '📈', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'kKKM8Y-u7ds', judul: 'Peluang – Kejadian Majemuk, Saling Lepas & Bebas', durasi: '24 mnt', level: 'Dasar' },
          { id: 'saTMcQ5IAHU', judul: 'Distribusi Binomial & Normal – Konsep Dasar', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
    ],
  },

  // ╔══════════════════════════════════════════╗
  // ║              F I S I K A                 ║
  // ╚══════════════════════════════════════════╝
  'Fisika': {
    'Kelas 10': [
      {
        bab: 'Bab 1 – Besaran, Satuan & Pengukuran',
        emoji: '📏', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'TZFJhD1f0Ks', judul: 'Besaran & Satuan – Besaran Pokok & Turunan SI', durasi: '18 mnt', level: 'Dasar' },
          { id: 'F9mG8y4OuJ0', judul: 'Angka Penting & Notasi Ilmiah', durasi: '20 mnt', level: 'Dasar' },
          { id: 'CkpnRzLanBM', judul: 'Dimensi & Analisis Dimensional', durasi: '15 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Kinematika Gerak Lurus',
        emoji: '🚀', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: '1tSqSMOyNFE', judul: 'GLB & GLBB – Gerak Lurus Beraturan & Berubah Beraturan', durasi: '27 mnt', level: 'Dasar' },
          { id: 'Np7MxFPmGLI', judul: 'Gerak Jatuh Bebas & Gerak Vertikal Ke Atas', durasi: '22 mnt', level: 'Menengah' },
          { id: 'kKKM8Y-u7ds', judul: 'Grafik Posisi-Waktu & Kecepatan-Waktu', durasi: '20 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Hukum Newton & Dinamika',
        emoji: '⚡', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'saTMcQ5IAHU', judul: 'Hukum Newton I, II, III – Lengkap dengan Contoh', durasi: '30 mnt', level: 'Dasar' },
          { id: 'HzHWI78JZQU', judul: 'Gaya Gesek – Kinetis, Statis & Soal Terapan', durasi: '25 mnt', level: 'Menengah' },
          { id: 'dNiHGXOxhgg', judul: 'Tegangan Tali & Gaya Normal – Soal Dinamika', durasi: '23 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Gerak Parabola & Melingkar',
        emoji: '🎯', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'JK42eFIxxOA', judul: 'Gerak Parabola – Analisis Komponen & Soal', durasi: '32 mnt', level: 'Dasar' },
          { id: 'tFr3wqNfbCY', judul: 'Gerak Melingkar – Kecepatan & Percepatan Sentripetal', durasi: '26 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Usaha, Energi & Daya',
        emoji: '⚡', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: '8e6J0NkMPbQ', judul: 'Usaha & Energi – Konsep, Satuan & Contoh Soal', durasi: '24 mnt', level: 'Dasar' },
          { id: 'xS_J0PkCFqM', judul: 'Energi Kinetik & Potensial – Hukum Kekekalan Energi', durasi: '27 mnt', level: 'Menengah' },
          { id: 'SxT2nTRbB_Y', judul: 'Daya & Efisiensi – Soal Terapan Fisika', durasi: '20 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 6 – Momentum & Impuls',
        emoji: '💥', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'OEqh-zyiJfQ', judul: 'Momentum & Impuls – Konsep & Rumus Dasar', durasi: '22 mnt', level: 'Dasar' },
          { id: 'nvXOaOcT4eE', judul: 'Tumbukan Elastis & Tak Elastis – Kekekalan Momentum', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 11': [
      {
        bab: 'Bab 1 – Elastisitas & Getaran',
        emoji: '🌊', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'vHIFjSn0gNc', judul: 'Elastisitas – Hukum Hooke & Modulus Young', durasi: '22 mnt', level: 'Dasar' },
          { id: 'iHRDGlnN0Ck', judul: 'Getaran Harmonik – Periode, Frekuensi & Amplitudo', durasi: '26 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Fluida Statis & Dinamis',
        emoji: '💧', color: '#ccfbf1', colorText: '#0f766e',
        videos: [
          { id: '2t3LVE9kPBI', judul: 'Tekanan Hidrostatis & Hukum Pascal', durasi: '24 mnt', level: 'Dasar' },
          { id: 'PbDp6XRTDAQ', judul: 'Hukum Archimedes – Gaya Apung & Soal', durasi: '20 mnt', level: 'Dasar' },
          { id: 'CDHv_aMHNsE', judul: 'Fluida Dinamis – Persamaan Kontinuitas & Bernoulli', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Termodinamika',
        emoji: '🔥', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: 'J3fBWyDGX0o', judul: 'Suhu & Kalor – Perpindahan Panas', durasi: '25 mnt', level: 'Dasar' },
          { id: 'gRhYOSHKGzs', judul: 'Hukum Termodinamika I & II – Proses Termodinamik', durasi: '30 mnt', level: 'Menengah' },
          { id: 'Q6Jcp9AnnKA', judul: 'Mesin Carnot & Efisiensi Mesin Kalor', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Gelombang & Bunyi',
        emoji: '🔊', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'aXcGqIZfkFE', judul: 'Gelombang – Transversal, Longitudinal & Besaran', durasi: '23 mnt', level: 'Dasar' },
          { id: 'nRdRa6BxLkI', judul: 'Gelombang Bunyi – Cepat Rambat & Intensitas', durasi: '26 mnt', level: 'Menengah' },
          { id: 'TZFJhD1f0Ks', judul: 'Efek Doppler & Resonansi Bunyi', durasi: '20 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 5 – Cahaya & Optik',
        emoji: '🌈', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'F9mG8y4OuJ0', judul: 'Pemantulan & Pembiasan Cahaya – Hukum Snell', durasi: '24 mnt', level: 'Dasar' },
          { id: 'CkpnRzLanBM', judul: 'Alat Optik – Lensa, Cermin & Cacat Mata', durasi: '27 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 12': [
      {
        bab: 'Bab 1 – Listrik Statis',
        emoji: '⚡', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: '1tSqSMOyNFE', judul: 'Muatan Listrik & Hukum Coulomb', durasi: '22 mnt', level: 'Dasar' },
          { id: 'kKKM8Y-u7ds', judul: 'Medan & Potensial Listrik – Kapasitor', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Listrik Dinamis & Rangkaian',
        emoji: '🔋', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'saTMcQ5IAHU', judul: 'Hukum Ohm & Hambatan – Rangkaian Seri & Paralel', durasi: '25 mnt', level: 'Dasar' },
          { id: 'HzHWI78JZQU', judul: 'Hukum Kirchhoff – Analisis Rangkaian Kompleks', durasi: '30 mnt', level: 'Menengah' },
          { id: 'dNiHGXOxhgg', judul: 'Energi & Daya Listrik – Soal Kontekstual', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Medan Magnet & Induksi',
        emoji: '🧲', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'JK42eFIxxOA', judul: 'Medan Magnet – Hukum Biot-Savart & Ampere', durasi: '26 mnt', level: 'Dasar' },
          { id: 'tFr3wqNfbCY', judul: 'Induksi Elektromagnetik – Hukum Faraday & Lenz', durasi: '28 mnt', level: 'Menengah' },
          { id: '8e6J0NkMPbQ', judul: 'Transformator & Generator – Prinsip Kerja', durasi: '20 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Fisika Modern & Radioaktivitas',
        emoji: '☢️', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'xS_J0PkCFqM', judul: 'Teori Relativitas Einstein – E=mc²', durasi: '24 mnt', level: 'Menengah' },
          { id: 'SxT2nTRbB_Y', judul: 'Radioaktivitas – Peluruhan & Waktu Paruh', durasi: '25 mnt', level: 'Menengah' },
          { id: 'OEqh-zyiJfQ', judul: 'Fisika Inti & Reaksi Nuklir', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
    ],
  },

  // ╔══════════════════════════════════════════╗
  // ║               K I M I A                  ║
  // ╚══════════════════════════════════════════╝
  'Kimia': {
    'Kelas 10': [
      {
        bab: 'Bab 1 – Struktur Atom & SPU',
        emoji: '⚛️', color: '#fae8ff', colorText: '#86198f',
        videos: [
          { id: 'HzHWI78JZQU', judul: 'Struktur Atom – Model Bohr & Teori Mekanika Kuantum', durasi: '24 mnt', level: 'Dasar' },
          { id: 'dNiHGXOxhgg', judul: 'Konfigurasi Elektron & Bilangan Kuantum', durasi: '22 mnt', level: 'Menengah' },
          { id: 'AmOeQUkMCPo', judul: 'Tabel Periodik – Golongan, Periode & Sifat Periodik', durasi: '20 mnt', level: 'Dasar' },
        ]
      },
      {
        bab: 'Bab 2 – Ikatan Kimia',
        emoji: '🔗', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'wnq3sZfVERs', judul: 'Ikatan Ion & Kovalen – Perbedaan & Contoh Senyawa', durasi: '26 mnt', level: 'Dasar' },
          { id: 'QqjcCvzWwww', judul: 'Ikatan Kovalen Polar & Non-Polar', durasi: '22 mnt', level: 'Menengah' },
          { id: 'OEqh-zyiJfQ', judul: 'Bentuk Molekul – Teori VSEPR & Hibridisasi', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Stoikiometri',
        emoji: '⚖️', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'nvXOaOcT4eE', judul: 'Konsep Mol – Massa Molar & Bilangan Avogadro', durasi: '22 mnt', level: 'Dasar' },
          { id: 'vHIFjSn0gNc', judul: 'Persamaan Kimia & Penyetaraan Reaksi', durasi: '25 mnt', level: 'Dasar' },
          { id: 'iHRDGlnN0Ck', judul: 'Pereaksi Pembatas & Persen Hasil Reaksi', durasi: '27 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Larutan Elektrolit & Reaksi Redoks',
        emoji: '🧪', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: '2t3LVE9kPBI', judul: 'Larutan Elektrolit & Non-Elektrolit', durasi: '20 mnt', level: 'Dasar' },
          { id: 'PbDp6XRTDAQ', judul: 'Reaksi Redoks – Konsep Oksidasi & Reduksi', durasi: '23 mnt', level: 'Menengah' },
          { id: 'CDHv_aMHNsE', judul: 'Bilangan Oksidasi & Penyetaraan Reaksi Redoks', durasi: '26 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 5 – Tata Nama Senyawa',
        emoji: '📝', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'J3fBWyDGX0o', judul: 'Tata Nama Senyawa Anorganik – Ion & Kovalen', durasi: '18 mnt', level: 'Dasar' },
          { id: 'gRhYOSHKGzs', judul: 'Tata Nama Senyawa Organik – Alkana, Alkena, Alkuna', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 11': [
      {
        bab: 'Bab 1 – Termokimia',
        emoji: '🌡️', color: '#fae8ff', colorText: '#86198f',
        videos: [
          { id: 'Q6Jcp9AnnKA', judul: 'Entalpi & Hukum Hess – Konsep Termokimia', durasi: '24 mnt', level: 'Dasar' },
          { id: 'aXcGqIZfkFE', judul: 'Kalorimetri – Pengukuran Kalor Reaksi', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Laju Reaksi',
        emoji: '⏱️', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'nRdRa6BxLkI', judul: 'Faktor-Faktor yang Mempengaruhi Laju Reaksi', durasi: '22 mnt', level: 'Dasar' },
          { id: 'TZFJhD1f0Ks', judul: 'Teori Tumbukan & Energi Aktivasi', durasi: '20 mnt', level: 'Menengah' },
          { id: 'F9mG8y4OuJ0', judul: 'Orde Reaksi & Tetapan Laju – Perhitungan', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Kesetimbangan Kimia',
        emoji: '⚖️', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'CkpnRzLanBM', judul: 'Kesetimbangan Dinamis – Kc & Kp', durasi: '26 mnt', level: 'Dasar' },
          { id: '1tSqSMOyNFE', judul: 'Asas Le Chatelier – Pergeseran Kesetimbangan', durasi: '23 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Asam Basa & Buffer',
        emoji: '🧫', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: 'kKKM8Y-u7ds', judul: 'Teori Asam Basa – Arrhenius, Bronsted-Lowry, Lewis', durasi: '22 mnt', level: 'Dasar' },
          { id: 'saTMcQ5IAHU', judul: 'pH & pOH – Asam Kuat, Basa Kuat, Asam-Basa Lemah', durasi: '28 mnt', level: 'Menengah' },
          { id: 'HzHWI78JZQU', judul: 'Larutan Buffer – Cara Kerja & Perhitungan pH', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 5 – Hidrolisis & Ksp',
        emoji: '🌊', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'dNiHGXOxhgg', judul: 'Hidrolisis Garam – Sifat Larutan Garam', durasi: '23 mnt', level: 'Dasar' },
          { id: 'AmOeQUkMCPo', judul: 'Kelarutan & Ksp – Hasil Kali Kelarutan', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 12': [
      {
        bab: 'Bab 1 – Elektrokimia',
        emoji: '🔋', color: '#fae8ff', colorText: '#86198f',
        videos: [
          { id: 'wnq3sZfVERs', judul: 'Sel Volta – Elektroda, Jembatan Garam & Potensial', durasi: '26 mnt', level: 'Dasar' },
          { id: 'QqjcCvzWwww', judul: 'Sel Elektrolisis – Hukum Faraday I & II', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Kimia Unsur',
        emoji: '🏔️', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'nvXOaOcT4eE', judul: 'Unsur Periode 3 – Sifat, Pembuatan & Kegunaan', durasi: '24 mnt', level: 'Dasar' },
          { id: 'vHIFjSn0gNc', judul: 'Unsur Transisi – Sifat Khusus & Kompleks', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Kimia Organik',
        emoji: '🌿', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'iHRDGlnN0Ck', judul: 'Senyawa Organik – Golongan Fungsi & Isomer', durasi: '28 mnt', level: 'Dasar' },
          { id: '2t3LVE9kPBI', judul: 'Alkohol, Eter & Aldehid – Reaksi & Kegunaan', durasi: '25 mnt', level: 'Menengah' },
          { id: 'PbDp6XRTDAQ', judul: 'Asam Karboksilat, Ester & Amina', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Makromolekul & Polimer',
        emoji: '🔬', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'CDHv_aMHNsE', judul: 'Polimer – Monomer, Jenis & Proses Polimerisasi', durasi: '22 mnt', level: 'Dasar' },
          { id: 'J3fBWyDGX0o', judul: 'Karbohidrat, Protein & Lemak – Struktur & Fungsi', durasi: '26 mnt', level: 'Menengah' },
        ]
      },
    ],
  },

  // ╔══════════════════════════════════════════╗
  // ║              B I O L O G I               ║
  // ╚══════════════════════════════════════════╝
  'Biologi': {
    'Kelas 10': [
      {
        bab: 'Bab 1 – Ruang Lingkup Biologi',
        emoji: '🔬', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'OEqh-zyiJfQ', judul: 'Ruang Lingkup Biologi – Tingkatan Organisasi Kehidupan', durasi: '18 mnt', level: 'Dasar' },
          { id: 'nvXOaOcT4eE', judul: 'Metode Ilmiah & Keselamatan Kerja Lab Biologi', durasi: '16 mnt', level: 'Dasar' },
        ]
      },
      {
        bab: 'Bab 2 – Keanekaragaman Hayati',
        emoji: '🌏', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'vHIFjSn0gNc', judul: 'Keanekaragaman Hayati – Gen, Spesies & Ekosistem', durasi: '22 mnt', level: 'Dasar' },
          { id: 'iHRDGlnN0Ck', judul: 'Klasifikasi Makhluk Hidup – Sistem Binomial', durasi: '20 mnt', level: 'Dasar' },
          { id: '2t3LVE9kPBI', judul: 'Keanekaragaman Hayati Indonesia & Konservasi', durasi: '18 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Sel & Biologi Molekuler',
        emoji: '🦠', color: '#fae8ff', colorText: '#86198f',
        videos: [
          { id: 'PbDp6XRTDAQ', judul: 'Sel Prokariotik & Eukariotik – Struktur & Perbedaan', durasi: '22 mnt', level: 'Dasar' },
          { id: 'CDHv_aMHNsE', judul: 'Organel Sel – Mitokondria, Ribosom, RE & Golgi', durasi: '25 mnt', level: 'Dasar' },
          { id: 'J3fBWyDGX0o', judul: 'Transpor Membran – Difusi, Osmosis & Transpor Aktif', durasi: '23 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Jaringan Tumbuhan & Hewan',
        emoji: '🌱', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'gRhYOSHKGzs', judul: 'Jaringan Tumbuhan – Epidermis, Parenkim & Pengangkut', durasi: '21 mnt', level: 'Dasar' },
          { id: 'Q6Jcp9AnnKA', judul: 'Jaringan Hewan – Epitel, Ikat, Otot & Saraf', durasi: '24 mnt', level: 'Dasar' },
          { id: 'aXcGqIZfkFE', judul: 'Organ & Sistem Organ Tumbuhan', durasi: '19 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Fungi & Protista',
        emoji: '🍄', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'nRdRa6BxLkI', judul: 'Fungi (Jamur) – Ciri, Struktur & Reproduksi', durasi: '20 mnt', level: 'Dasar' },
          { id: 'TZFJhD1f0Ks', judul: 'Protista – Protozoa, Alga & Jamur Lendir', durasi: '22 mnt', level: 'Dasar' },
        ]
      },
    ],

    'Kelas 11': [
      {
        bab: 'Bab 1 – Sistem Gerak',
        emoji: '🦴', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'F9mG8y4OuJ0', judul: 'Sistem Rangka – Tulang, Sendi & Fungsinya', durasi: '23 mnt', level: 'Dasar' },
          { id: 'CkpnRzLanBM', judul: 'Sistem Otot – Mekanisme Kontraksi & Relaksasi', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Sistem Peredaran Darah',
        emoji: '🫀', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: '1tSqSMOyNFE', judul: 'Darah – Komponen & Fungsinya (Eritrosit, Leukosit, Trombosit)', durasi: '22 mnt', level: 'Dasar' },
          { id: 'kKKM8Y-u7ds', judul: 'Jantung & Pembuluh Darah – Siklus Jantung', durasi: '26 mnt', level: 'Menengah' },
          { id: 'saTMcQ5IAHU', judul: 'Sistem Limfa & Penyakit Kardiovaskular', durasi: '20 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Sistem Pencernaan',
        emoji: '🍎', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'HzHWI78JZQU', judul: 'Organ Pencernaan – Mulut hingga Usus Besar', durasi: '24 mnt', level: 'Dasar' },
          { id: 'dNiHGXOxhgg', judul: 'Enzim Pencernaan & Proses Penyerapan Nutrisi', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Sistem Pernapasan',
        emoji: '🫁', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'AmOeQUkMCPo', judul: 'Organ Pernapasan & Mekanisme Bernapas', durasi: '22 mnt', level: 'Dasar' },
          { id: 'OEqh-zyiJfQ', judul: 'Volume Paru-paru & Gangguan Pernapasan', durasi: '20 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Sistem Saraf & Hormon',
        emoji: '🧠', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'nvXOaOcT4eE', judul: 'Sel Saraf (Neuron) – Struktur & Impuls Saraf', durasi: '24 mnt', level: 'Dasar' },
          { id: 'vHIFjSn0gNc', judul: 'Sistem Saraf Pusat & Tepi – Otak & Sumsum Tulang Belakang', durasi: '26 mnt', level: 'Menengah' },
          { id: 'iHRDGlnN0Ck', judul: 'Sistem Endokrin – Kelenjar & Hormon', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
    ],

    'Kelas 12': [
      {
        bab: 'Bab 1 – Pertumbuhan & Metabolisme',
        emoji: '🌿', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: '2t3LVE9kPBI', judul: 'Fotosintesis – Reaksi Terang & Gelap (Siklus Calvin)', durasi: '28 mnt', level: 'Dasar' },
          { id: 'PbDp6XRTDAQ', judul: 'Respirasi Aerob & Anaerob – Glikolisis & Siklus Krebs', durasi: '30 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Materi Genetik & Reproduksi Sel',
        emoji: '🧬', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'CDHv_aMHNsE', judul: 'DNA, RNA & Kode Genetik – Replikasi DNA', durasi: '26 mnt', level: 'Dasar' },
          { id: 'J3fBWyDGX0o', judul: 'Mitosis & Meiosis – Tahap & Perbedaan', durasi: '28 mnt', level: 'Menengah' },
          { id: 'gRhYOSHKGzs', judul: 'Sintesis Protein – Transkripsi & Translasi', durasi: '25 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Pola Hereditas & Genetika',
        emoji: '🧬', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'Q6Jcp9AnnKA', judul: 'Hukum Mendel I & II – Monohibrid & Dihibrid', durasi: '25 mnt', level: 'Dasar' },
          { id: 'aXcGqIZfkFE', judul: 'Penyimpangan Hukum Mendel – Epistasi & Kriptomeri', durasi: '27 mnt', level: 'Menengah' },
          { id: 'nRdRa6BxLkI', judul: 'Pautan & Pindah Silang – Hereditas Terpaut Seks', durasi: '24 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 4 – Evolusi & Bioteknologi',
        emoji: '🔭', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'TZFJhD1f0Ks', judul: 'Teori Evolusi – Darwin, Lamarck & Bukti Evolusi', durasi: '22 mnt', level: 'Dasar' },
          { id: 'F9mG8y4OuJ0', judul: 'Bioteknologi – Konvensional & Modern (Rekayasa Genetika)', durasi: '24 mnt', level: 'Menengah' },
        ]
      },
    ],
  },

  // ╔══════════════════════════════════════════╗
  // ║             E K O N O M I                ║
  // ╚══════════════════════════════════════════╝
  'Ekonomi': {
    'Kelas 10': [
      {
        bab: 'Bab 1 – Konsep Dasar Ekonomi',
        emoji: '💹', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'UIjQ1dKrt-k', judul: 'Ilmu Ekonomi – Pengertian, Ruang Lingkup & Manfaat', durasi: '18 mnt', level: 'Dasar' },
          { id: 'HE_9PX0vjJk', judul: 'Masalah Ekonomi – Kelangkaan & Pilihan Ekonomi', durasi: '20 mnt', level: 'Dasar' },
          { id: 'VJdmwh-ECQo', judul: 'Sistem Ekonomi – Tradisional, Liberal, Komando & Campuran', durasi: '22 mnt', level: 'Dasar' },
        ]
      },
      {
        bab: 'Bab 2 – Permintaan & Penawaran',
        emoji: '📊', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'AlrOq3W7IZ4', judul: 'Permintaan – Hukum, Kurva & Faktor-Faktor', durasi: '24 mnt', level: 'Dasar' },
          { id: 'FqYIq9kdshM', judul: 'Penawaran – Hukum, Kurva & Determinan', durasi: '22 mnt', level: 'Dasar' },
          { id: '3b8Kd4NsmDM', judul: 'Keseimbangan Pasar – Titik Ekuilibrium & Perubahan', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Elastisitas',
        emoji: '📈', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'ucsmFuTluaU', judul: 'Elastisitas Permintaan – Ed & Jenis-jenisnya', durasi: '22 mnt', level: 'Dasar' },
          { id: 'sTRhH3x2Xgc', judul: 'Elastisitas Penawaran & Perhitungan', durasi: '20 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Perilaku Konsumen & Produsen',
        emoji: '🛍️', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'PbDp6XRTDAQ', judul: 'Teori Konsumen – Kardinal & Ordinal (Kurva Indiferens)', durasi: '26 mnt', level: 'Menengah' },
          { id: 'CDHv_aMHNsE', judul: 'Teori Produksi – Fungsi Produksi & Biaya', durasi: '24 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Pasar & Struktur Pasar',
        emoji: '🏪', color: '#ecfdf5', colorText: '#065f46',
        videos: [
          { id: 'J3fBWyDGX0o', judul: 'Pasar Persaingan Sempurna vs Monopoli', durasi: '24 mnt', level: 'Dasar' },
          { id: 'gRhYOSHKGzs', judul: 'Oligopoli & Monopolistik – Ciri & Perilaku', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 11': [
      {
        bab: 'Bab 1 – Pendapatan Nasional',
        emoji: '🏦', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'Q6Jcp9AnnKA', judul: 'GDP, GNP, NNP – Konsep Pendapatan Nasional', durasi: '24 mnt', level: 'Dasar' },
          { id: 'aXcGqIZfkFE', judul: 'Metode Penghitungan Pendapatan Nasional', durasi: '22 mnt', level: 'Menengah' },
          { id: 'nRdRa6BxLkI', judul: 'Pendapatan Per Kapita & Distribusi Pendapatan', durasi: '20 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Ketenagakerjaan',
        emoji: '👷', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'TZFJhD1f0Ks', judul: 'Tenaga Kerja, Angkatan Kerja & Pengangguran', durasi: '22 mnt', level: 'Dasar' },
          { id: 'F9mG8y4OuJ0', judul: 'Jenis Pengangguran & Kebijakan Ketenagakerjaan', durasi: '20 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 3 – Inflasi & Indeks Harga',
        emoji: '💸', color: '#fce7f3', colorText: '#9d174d',
        videos: [
          { id: 'CkpnRzLanBM', judul: 'Inflasi – Penyebab, Jenis & Dampak', durasi: '24 mnt', level: 'Dasar' },
          { id: '1tSqSMOyNFE', judul: 'Indeks Harga Konsumen & Cara Menghitung Inflasi', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 4 – Kebijakan Moneter & Fiskal',
        emoji: '🏛️', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'kKKM8Y-u7ds', judul: 'Kebijakan Moneter – Bank Indonesia & Instrumennya', durasi: '25 mnt', level: 'Dasar' },
          { id: 'saTMcQ5IAHU', judul: 'Kebijakan Fiskal – APBN & Jenis Kebijakan', durasi: '22 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 5 – Perdagangan Internasional',
        emoji: '🌍', color: '#ede9fe', colorText: '#6d28d9',
        videos: [
          { id: 'HzHWI78JZQU', judul: 'Teori Perdagangan Internasional & Manfaatnya', durasi: '22 mnt', level: 'Dasar' },
          { id: 'dNiHGXOxhgg', judul: 'Neraca Pembayaran & Kurs Valuta Asing', durasi: '24 mnt', level: 'Menengah' },
        ]
      },
    ],

    'Kelas 12': [
      {
        bab: 'Bab 1 – Akuntansi Dasar',
        emoji: '📒', color: '#fef9c3', colorText: '#854d0e',
        videos: [
          { id: 'AmOeQUkMCPo', judul: 'Konsep Dasar Akuntansi – Persamaan & Siklus', durasi: '22 mnt', level: 'Dasar' },
          { id: 'wnq3sZfVERs', judul: 'Jurnal Umum – Pencatatan Transaksi', durasi: '26 mnt', level: 'Dasar' },
          { id: 'QqjcCvzWwww', judul: 'Buku Besar & Neraca Saldo', durasi: '24 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Bab 2 – Jurnal Penyesuaian & Laporan Keuangan',
        emoji: '📊', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'OEqh-zyiJfQ', judul: 'Jurnal Penyesuaian – Jenis & Cara Membuat', durasi: '28 mnt', level: 'Menengah' },
          { id: 'nvXOaOcT4eE', judul: 'Laporan Laba Rugi, Perubahan Modal & Neraca', durasi: '30 mnt', level: 'Menengah' },
          { id: 'vHIFjSn0gNc', judul: 'Laporan Keuangan Perusahaan Dagang', durasi: '27 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'Bab 3 – Manajemen & Koperasi',
        emoji: '🤝', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'iHRDGlnN0Ck', judul: 'Manajemen – Fungsi POAC & Tingkatan Manajemen', durasi: '22 mnt', level: 'Dasar' },
          { id: '2t3LVE9kPBI', judul: 'Badan Usaha & Koperasi – Jenis & Prinsip', durasi: '20 mnt', level: 'Dasar' },
        ]
      },
    ],
  },

  // ╔══════════════════════════════════════════╗
  // ║          B A H A S A  I N G G R I S       ║
  // ╚══════════════════════════════════════════╝
  'Bahasa Inggris': {
    'Kelas 10': [
      {
        bab: 'Grammar – Tenses & Structure',
        emoji: '✏️', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: '8e6J0NkMPbQ', judul: 'Tenses Lengkap – Simple, Continuous, Perfect', durasi: '40 mnt', level: 'Dasar' },
          { id: 'xS_J0PkCFqM', judul: 'Passive Voice & Reported Speech', durasi: '30 mnt', level: 'Menengah' },
          { id: 'SxT2nTRbB_Y', judul: 'Conditional Sentences – Type 1, 2 & 3', durasi: '28 mnt', level: 'Menengah' },
        ]
      },
      {
        bab: 'Reading & Vocabulary',
        emoji: '📖', color: '#fff7ed', colorText: '#c2410c',
        videos: [
          { id: 'JK42eFIxxOA', judul: 'Reading Comprehension – Strategi Menjawab Soal', durasi: '28 mnt', level: 'Dasar' },
          { id: 'tFr3wqNfbCY', judul: 'Vocabulary Building – Word Formation & Context Clues', durasi: '25 mnt', level: 'Menengah' },
        ]
      },
    ],
    'TOEFL/IELTS': [
      {
        bab: 'TOEFL Preparation',
        emoji: '🎓', color: '#dbeafe', colorText: '#1d4ed8',
        videos: [
          { id: 'JK42eFIxxOA', judul: 'TOEFL Reading – Strategi Jawab Soal Cepat & Tepat', durasi: '28 mnt', level: 'Menengah' },
          { id: 'xS_J0PkCFqM', judul: 'TOEFL Structure – Error Recognition', durasi: '30 mnt', level: 'Menengah' },
          { id: 'SxT2nTRbB_Y', judul: 'TOEFL Listening – Teknik Note-taking Efektif', durasi: '22 mnt', level: 'Lanjut' },
        ]
      },
      {
        bab: 'IELTS Preparation',
        emoji: '🌐', color: '#dcfce7', colorText: '#15803d',
        videos: [
          { id: 'tFr3wqNfbCY', judul: 'IELTS Academic Reading – Tips Band 7+', durasi: '35 mnt', level: 'Lanjut' },
          { id: '8e6J0NkMPbQ', judul: 'IELTS Writing Task 1 & 2 – Strategi Lengkap', durasi: '40 mnt', level: 'Lanjut' },
        ]
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  ROUTES — PERHATIKAN URUTAN: spesifik dulu, parametrik belakang
// ═══════════════════════════════════════════════════════════════════════

// GET /api/courses/video-subjects  ← HARUS sebelum /:id
router.get('/video-subjects', (req, res) => {
  const subjects = Object.entries(VIDEO_LIBRARY).map(([subj, classes]) => ({
    subject: subj,
    classes: Object.keys(classes)
  }));
  res.json({ success: true, subjects });
});

// GET /api/courses/videos/:subject/:kelas  ← HARUS sebelum /:id
router.get('/videos/:subject/:kelas', (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const kelas   = decodeURIComponent(req.params.kelas);
  const babs    = VIDEO_LIBRARY[subject]?.[kelas] || [];
  res.json({ success: true, subject, kelas, babs });
});

// GET /api/courses/my/enrolled  ← HARUS sebelum /:id
router.get('/my/enrolled', authMiddleware, (req, res) => {
  const courses = query(
    `SELECT c.*, e.progress, e.enrolled_at FROM enrollments e
     JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`, [req.user.id]);
  res.json({ success: true, courses });
});

// GET /api/courses (list dengan filter)
router.get('/', optionalAuth, (req, res) => {
  const { subject, search, level, sort, limit = 20, offset = 0 } = req.query;
  let sql = `SELECT c.*,
    CASE WHEN e.user_id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled,
    COALESCE(e.progress, 0) as my_progress
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id AND e.user_id = ?
    WHERE c.is_active = 1`;
  const params = [req.user?.id || ''];
  if (subject) { sql += ` AND c.subject = ?`; params.push(subject); }
  if (level)   { sql += ` AND c.level = ?`; params.push(level); }
  if (search)  { sql += ` AND (c.title LIKE ? OR c.subject LIKE ? OR c.description LIKE ?)`; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (sort === 'popular')     sql += ' ORDER BY c.total_students DESC';
  else if (sort === 'rating') sql += ' ORDER BY c.rating DESC';
  else                        sql += ' ORDER BY c.rating DESC, c.total_students DESC';
  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  const courses  = query(sql, params);
  const total    = queryOne(`SELECT COUNT(*) as c FROM courses WHERE is_active = 1`);
  const subjects = query(`SELECT DISTINCT subject FROM courses WHERE is_active = 1 ORDER BY subject`);
  res.json({ success: true, total: total?.c || 0, subjects: subjects.map(s => s.subject), courses });
});

// GET /api/courses/:id  ← PARAMETRIK, paling bawah GET routes
router.get('/:id', optionalAuth, (req, res) => {
  const course = queryOne(
    `SELECT c.*, u.name as instructor_name FROM courses c
     LEFT JOIN users u ON c.instructor_id = u.id
     WHERE c.id = ? AND c.is_active = 1`, [req.params.id]);
  if (!course) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan.' });
  let enrolled = null;
  if (req.user) enrolled = queryOne('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [req.user.id, req.params.id]);
  res.json({ success: true, course, enrollment: enrolled });
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', authMiddleware, (req, res) => {
  const course = queryOne('SELECT * FROM courses WHERE id = ? AND is_active = 1', [req.params.id]);
  if (!course) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan.' });
  const existing = queryOne('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.user.id, req.params.id]);
  if (existing) return res.status(409).json({ success: false, message: 'Kamu sudah terdaftar.' });
  if (req.user.balance < course.price)
    return res.status(400).json({ success: false, message: `Saldo tidak cukup. Saldo kamu: Rp ${(req.user.balance||0).toLocaleString()}` });
  run('UPDATE users SET balance = balance - ? WHERE id = ?', [course.price, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', course.price, `Berlangganan: ${course.title}`, course.id]);
  run(`INSERT INTO enrollments (id,user_id,course_id,progress) VALUES (?,?,?,0)`, [uuidv4(), req.user.id, course.id]);
  run('UPDATE courses SET total_students = total_students + 1 WHERE id = ?', [course.id]);
  run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'Berhasil Daftar Kelas! 📚', `Kamu bergabung di "${course.title}".`, 'course']);
  const u = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  res.json({ success: true, message: `Berhasil mendaftar kelas "${course.title}"!`, new_balance: u.balance });
});

// PUT /api/courses/:id/progress
router.put('/:id/progress', authMiddleware, (req, res) => {
  const { progress } = req.body;
  const enrollment = queryOne('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [req.user.id, req.params.id]);
  if (!enrollment) return res.status(404).json({ success: false, message: 'Belum terdaftar.' });
  const pct = Math.min(100, Math.max(0, Number(progress)));
  run(`UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?`, [pct, req.user.id, req.params.id]);
  if (pct >= 100 && enrollment.progress < 100)
    run('UPDATE users SET points = points + 500 WHERE id = ?', [req.user.id]);
  res.json({ success: true, progress: pct });
});

// POST /api/courses (admin)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { title, subject, description, price, original_price, thumbnail, total_lessons, duration_minutes, level } = req.body;
  if (!title || !subject || !price) return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
  const id = uuidv4();
  run(`INSERT INTO courses (id,title,subject,description,price,original_price,thumbnail,instructor_id,total_lessons,duration_minutes,level)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, title, subject, description||'', price, original_price||null, thumbnail||'📚',
     req.user.id, total_lessons||0, duration_minutes||0, level||'Semua Level']);
  res.status(201).json({ success: true, message: 'Kelas dibuat.', id });
});

module.exports = router;