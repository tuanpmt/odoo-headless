const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, stage, priority, page: pg } = req.query;
    const page = parseInt(pg) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    let where = ['l.active = true'];
    let params = [];
    let pi = 1;

    if (search) {
      where.push(`(l.name ILIKE $${pi} OR l.partner_name ILIKE $${pi} OR l.email_from ILIKE $${pi} OR l.contact_name ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (stage) {
      where.push(`l.stage_id = $${pi}`);
      params.push(parseInt(stage));
      pi++;
    }
    if (priority) {
      where.push(`l.priority = $${pi}`);
      params.push(priority);
      pi++;
    }

    const whereClause = where.join(' AND ');

    const [countRes, leadsRes, stagesRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM crm_lead l WHERE ${whereClause}`, params),
      pool.query(`
        SELECT l.id, l.name, l.expected_revenue, l.priority, l.type, l.email_from,
               l.contact_name, l.partner_name, l.phone, l.city, l.date_deadline,
               s.name as stage_name, l.stage_id,
               p.name as partner_display, l.create_date,
               u.login as user_login, up.name as user_name
        FROM crm_lead l
        LEFT JOIN crm_stage s ON l.stage_id = s.id
        LEFT JOIN res_partner p ON l.partner_id = p.id
        LEFT JOIN res_users u ON l.user_id = u.id
        LEFT JOIN res_partner up ON u.partner_id = up.id
        WHERE ${whereClause}
        ORDER BY l.create_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params),
      pool.query(`SELECT id, name FROM crm_stage ORDER BY id`),
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.render('pages/crm/list', {
      leads: leadsRes.rows,
      stages: stagesRes.rows,
      filters: { search, stage, priority },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      page: 'crm',
    });
  } catch (err) {
    console.error('CRM list error:', err);
    res.status(500).render('pages/error', { error: err.message, page: 'crm' });
  }
});

router.get('/create', async (req, res) => {
  const [stages, users, partners] = await Promise.all([
    pool.query(`SELECT id, name FROM crm_stage ORDER BY id`),
    pool.query(`SELECT u.id, p.name FROM res_users u JOIN res_partner p ON u.partner_id=p.id WHERE u.active=true ORDER BY p.name`),
    pool.query(`SELECT id, name FROM res_partner WHERE active=true AND is_company=true ORDER BY name LIMIT 100`),
  ]);
  res.render('pages/crm/form', { lead: null, stages: stages.rows, users: users.rows, partners: partners.rows, page: 'crm' });
});

router.post('/create', async (req, res) => {
  try {
    const { name, partner_name, contact_name, email_from, phone, expected_revenue, priority, stage_id, user_id, type, description } = req.body;
    await pool.query(`
      INSERT INTO crm_lead (name, partner_name, contact_name, email_from, phone, expected_revenue, priority, stage_id, user_id, type, description, active, create_uid, write_uid, create_date, write_date, company_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12,$12,NOW(),NOW(),1)
    `, [name, partner_name, contact_name, email_from, phone, parseFloat(expected_revenue)||0, priority||'1', parseInt(stage_id)||1, parseInt(user_id)||null, type||'lead', description, req.session.user.id]);
    res.redirect('/crm');
  } catch (err) {
    console.error('CRM create error:', err);
    res.redirect('/crm?error=create');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const lead = await pool.query(`
      SELECT l.*, s.name as stage_name, p.name as partner_display,
             up.name as user_name
      FROM crm_lead l
      LEFT JOIN crm_stage s ON l.stage_id = s.id
      LEFT JOIN res_partner p ON l.partner_id = p.id
      LEFT JOIN res_users u ON l.user_id = u.id
      LEFT JOIN res_partner up ON u.partner_id = up.id
      WHERE l.id = $1
    `, [req.params.id]);
    if (!lead.rows.length) return res.redirect('/crm');
    
    const [stages, users, partners] = await Promise.all([
      pool.query(`SELECT id, name FROM crm_stage ORDER BY id`),
      pool.query(`SELECT u.id, p.name FROM res_users u JOIN res_partner p ON u.partner_id=p.id WHERE u.active=true ORDER BY p.name`),
      pool.query(`SELECT id, name FROM res_partner WHERE active=true AND is_company=true ORDER BY name LIMIT 100`),
    ]);
    res.render('pages/crm/form', { lead: lead.rows[0], stages: stages.rows, users: users.rows, partners: partners.rows, page: 'crm' });
  } catch (err) {
    console.error('CRM detail error:', err);
    res.redirect('/crm');
  }
});

router.post('/:id', async (req, res) => {
  try {
    const { name, partner_name, contact_name, email_from, phone, expected_revenue, priority, stage_id, user_id, type, description } = req.body;
    await pool.query(`
      UPDATE crm_lead SET name=$1, partner_name=$2, contact_name=$3, email_from=$4, phone=$5,
        expected_revenue=$6, priority=$7, stage_id=$8, user_id=$9, type=$10, description=$11,
        write_uid=$12, write_date=NOW()
      WHERE id=$13
    `, [name, partner_name, contact_name, email_from, phone, parseFloat(expected_revenue)||0, priority||'1', parseInt(stage_id)||1, parseInt(user_id)||null, type||'lead', description, req.session.user.id, req.params.id]);
    res.redirect('/crm');
  } catch (err) {
    console.error('CRM update error:', err);
    res.redirect(`/crm/${req.params.id}?error=update`);
  }
});

module.exports = router;
