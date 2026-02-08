const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, type, page: pg } = req.query;
    const page = parseInt(pg) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    let where = ['p.active = true'];
    let params = [];
    let pi = 1;

    if (search) {
      where.push(`(p.name ILIKE $${pi} OR p.email ILIKE $${pi} OR p.phone ILIKE $${pi} OR p.city ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (type === 'company') {
      where.push(`p.is_company = true`);
    } else if (type === 'contact') {
      where.push(`p.is_company = false`);
    }

    const whereClause = where.join(' AND ');

    const [countRes, contactsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM res_partner p WHERE ${whereClause}`, params),
      pool.query(`
        SELECT p.id, p.name, p.email, p.phone, p.mobile, p.city, p.is_company,
               p.function, p.website, p.customer_rank, p.supplier_rank,
               p.create_date, parent.name as company_name
        FROM res_partner p
        LEFT JOIN res_partner parent ON p.parent_id = parent.id
        WHERE ${whereClause}
        ORDER BY p.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `, params),
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.render('pages/contacts/list', {
      contacts: contactsRes.rows,
      filters: { search, type },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      page: 'contacts',
    });
  } catch (err) {
    console.error('Contacts list error:', err);
    res.status(500).render('pages/error', { error: err.message, page: 'contacts' });
  }
});

router.get('/create', (req, res) => {
  res.render('pages/contacts/form', { contact: null, page: 'contacts' });
});

router.post('/create', async (req, res) => {
  try {
    const { name, email, phone, mobile, city, street, function: func, website, is_company } = req.body;
    await pool.query(`
      INSERT INTO res_partner (name, email, phone, mobile, city, street, function, website, is_company, active, type, create_uid, write_uid, create_date, write_date, company_id, partner_share, lang)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'contact',$10,$10,NOW(),NOW(),1,true,'vi_VN')
    `, [name, email||null, phone||null, mobile||null, city||null, street||null, func||null, website||null, is_company==='on', req.session.user.id]);
    res.redirect('/contacts');
  } catch (err) {
    console.error('Contact create error:', err);
    res.redirect('/contacts?error=create');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await pool.query(`
      SELECT p.*, parent.name as company_name
      FROM res_partner p LEFT JOIN res_partner parent ON p.parent_id = parent.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (!contact.rows.length) return res.redirect('/contacts');
    res.render('pages/contacts/form', { contact: contact.rows[0], page: 'contacts' });
  } catch (err) {
    console.error('Contact detail error:', err);
    res.redirect('/contacts');
  }
});

router.post('/:id', async (req, res) => {
  try {
    const { name, email, phone, mobile, city, street, function: func, website, is_company } = req.body;
    await pool.query(`
      UPDATE res_partner SET name=$1, email=$2, phone=$3, mobile=$4, city=$5, street=$6,
        function=$7, website=$8, is_company=$9, write_uid=$10, write_date=NOW()
      WHERE id=$11
    `, [name, email||null, phone||null, mobile||null, city||null, street||null, func||null, website||null, is_company==='on', req.session.user.id, req.params.id]);
    res.redirect('/contacts');
  } catch (err) {
    console.error('Contact update error:', err);
    res.redirect(`/contacts/${req.params.id}?error=update`);
  }
});

module.exports = router;
