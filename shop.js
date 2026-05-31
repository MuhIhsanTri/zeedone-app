const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, run } = require('../db/database');
const { authMiddleware, adminOnly, optionalAuth } = require('../middleware/auth');

// GET /api/shop/products
router.get('/products', optionalAuth, (req, res) => {
  const { category, search, sort, limit = 20, offset = 0 } = req.query;
  let sql = `SELECT * FROM products WHERE is_active = 1`;
  const params = [];

  if (category) { sql += ` AND category = ?`; params.push(category); }
  if (search)   { sql += ` AND (title LIKE ? OR description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

  if (sort === 'popular')    sql += ' ORDER BY total_sold DESC';
  else if (sort === 'price') sql += ' ORDER BY price ASC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else sql += ' ORDER BY total_sold DESC, rating DESC';

  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const products = query(sql, params);
  const categories = query(`SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category`);
  const total = queryOne('SELECT COUNT(*) as c FROM products WHERE is_active = 1');

  res.json({ success: true, total: total?.c || 0, categories: categories.map(c => c.category), products });
});

// GET /api/shop/products/:id
router.get('/products/:id', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id]);
  if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
  res.json({ success: true, product });
});

// POST /api/shop/checkout - checkout with wallet
router.post('/checkout', authMiddleware, (req, res) => {
  const { items } = req.body; // [{ product_id, quantity }]
  if (!items || !items.length)
    return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });

  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = queryOne('SELECT * FROM products WHERE id = ? AND is_active = 1', [item.product_id]);
    if (!product) return res.status(404).json({ success: false, message: `Produk tidak ditemukan: ${item.product_id}` });
    if (!product.is_ebook && product.stock < (item.quantity || 1))
      return res.status(400).json({ success: false, message: `Stok ${product.title} tidak cukup.` });

    const qty = item.quantity || 1;
    total += product.price * qty;
    orderItems.push({ product, qty, price: product.price });
  }

  const user = queryOne('SELECT balance FROM users WHERE id = ?', [req.user.id]);
  if (user.balance < total)
    return res.status(400).json({ success: false, message: `Saldo tidak cukup. Butuh: Rp ${total.toLocaleString('id-ID')}, Saldo: Rp ${user.balance.toLocaleString('id-ID')}` });

  // Create order
  const orderId = uuidv4();
  run(`INSERT INTO orders (id,user_id,total_amount,status,payment_method) VALUES (?,?,?,?,?)`,
    [orderId, req.user.id, total, 'paid', 'e-wallet']);

  // Create order items & update stock
  for (const { product, qty, price } of orderItems) {
    run(`INSERT INTO order_items (id,order_id,product_id,quantity,price) VALUES (?,?,?,?,?)`,
      [uuidv4(), orderId, product.id, qty, price]);

    if (!product.is_ebook) {
      run('UPDATE products SET stock = stock - ?, total_sold = total_sold + ? WHERE id = ?', [qty, qty, product.id]);
    } else {
      run('UPDATE products SET total_sold = total_sold + ? WHERE id = ?', [qty, product.id]);
    }
  }

  // Deduct wallet
  run('UPDATE users SET balance = balance - ? WHERE id = ?', [total, req.user.id]);
  run(`INSERT INTO wallet_transactions (id,user_id,type,amount,description,reference_id) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'debit', total,
     `Pembelian ${orderItems.map(i => i.product.title).join(', ')}`, orderId]);

  // Award points (1 point per 1000 rupiah)
  const points = Math.floor(total / 1000);
  if (points > 0) run('UPDATE users SET points = points + ? WHERE id = ?', [points, req.user.id]);

  run(`INSERT INTO notifications (id,user_id,title,body,type) VALUES (?,?,?,?,?)`,
    [uuidv4(), req.user.id, 'Pesanan Berhasil! 🛒',
     `${orderItems.length} item berhasil dibeli. +${points} poin diperoleh.`, 'order']);

  const updated = queryOne('SELECT balance, points FROM users WHERE id = ?', [req.user.id]);
  res.json({
    success: true,
    message: `Pembelian berhasil! +${points} poin diperoleh.`,
    order_id: orderId,
    total,
    balance: updated.balance,
    points_earned: points
  });
});

// GET /api/shop/orders
router.get('/orders', authMiddleware, (req, res) => {
  const orders = query(`SELECT o.*, 
    (SELECT GROUP_CONCAT(p.title, ', ') FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items_summary,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`, [req.user.id]);
  res.json({ success: true, orders });
});

// GET /api/shop/orders/:id
router.get('/orders/:id', authMiddleware, (req, res) => {
  const order = queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

  const items = query(`SELECT oi.*, p.title, p.thumbnail, p.category, p.is_ebook
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?`, [req.params.id]);

  res.json({ success: true, order: { ...order, items } });
});

// POST /api/shop/products (admin)
router.post('/products', authMiddleware, adminOnly, (req, res) => {
  const { title, category, description, price, original_price, stock, thumbnail, is_ebook } = req.body;
  if (!title || !category || !price)
    return res.status(400).json({ success: false, message: 'Judul, kategori, dan harga wajib diisi.' });

  const id = uuidv4();
  run(`INSERT INTO products (id,title,category,description,price,original_price,stock,thumbnail,is_ebook)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, title, category, description || '', price, original_price || null, stock || 0, thumbnail || '📦', is_ebook ? 1 : 0]);

  res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', id });
});

module.exports = router;
