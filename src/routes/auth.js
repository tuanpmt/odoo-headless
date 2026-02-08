const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const router = express.Router();

// Odoo uses pbkdf2-sha512 with 600000 iterations
function verifyOdooPassword(password, hash) {
  return new Promise((resolve) => {
    // Parse: $pbkdf2-sha512$600000$salt_b64$hash_b64
    const parts = hash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha512') {
      return resolve(false);
    }
    const iterations = parseInt(parts[2]);
    // Odoo uses base64 with . instead of + (ab64 encoding)
    const salt = Buffer.from(parts[3].replace(/\./g, '+'), 'base64');
    const expected = Buffer.from(parts[4].replace(/\./g, '+'), 'base64');
    
    crypto.pbkdf2(password, salt, iterations, expected.length, 'sha512', (err, derived) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(derived, expected));
    });
  });
}

router.get('/login', (req, res) => {
  if (req.session && req.session.user) return res.redirect('/');
  res.render('pages/login', { error: req.query.error, layout: false });
});

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const result = await pool.query(
      `SELECT u.id, u.login, u.password, p.name 
       FROM res_users u JOIN res_partner p ON u.partner_id = p.id 
       WHERE u.login = $1 AND u.active = true`,
      [login]
    );
    
    if (result.rows.length === 0) {
      return res.redirect('/login?error=1');
    }
    
    const user = result.rows[0];
    const valid = await verifyOdooPassword(password, user.password);
    
    if (!valid) {
      return res.redirect('/login?error=1');
    }
    
    req.session.user = {
      id: user.id,
      login: user.login,
      name: user.name,
    };
    
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login?error=2');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
