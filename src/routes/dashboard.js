const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [leads, tasks, contacts, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM crm_lead WHERE active = true`),
      pool.query(`SELECT COUNT(*) as count FROM project_task WHERE project_id = 5 AND active = true`),
      pool.query(`SELECT COUNT(*) as count FROM res_partner WHERE active = true AND is_company = false AND parent_id IS NOT NULL OR (is_company = true AND active = true)`),
      pool.query(`SELECT COALESCE(SUM(expected_revenue), 0) as total FROM crm_lead WHERE active = true`),
    ]);

    // Recent leads
    const recentLeads = await pool.query(`
      SELECT l.id, l.name, l.expected_revenue, l.priority, 
             s.name as stage_name, p.name as partner_name,
             l.create_date
      FROM crm_lead l
      LEFT JOIN crm_stage s ON l.stage_id = s.id
      LEFT JOIN res_partner p ON l.partner_id = p.id
      WHERE l.active = true
      ORDER BY l.create_date DESC LIMIT 5
    `);

    // Recent tickets
    const recentTickets = await pool.query(`
      SELECT t.id, t.name, t.priority, t.state,
             ptt.name as stage_name, p.name as partner_name,
             t.create_date
      FROM project_task t
      LEFT JOIN project_task_type ptt ON t.stage_id = ptt.id
      LEFT JOIN res_partner p ON t.partner_id = p.id
      WHERE t.project_id = 5 AND t.active = true
      ORDER BY t.create_date DESC LIMIT 5
    `);

    // Lead by stage
    const leadsByStage = await pool.query(`
      SELECT s.name as stage_name, COUNT(*) as count
      FROM crm_lead l
      JOIN crm_stage s ON l.stage_id = s.id
      WHERE l.active = true
      GROUP BY s.id, s.name ORDER BY s.id
    `);

    res.render('pages/dashboard', {
      stats: {
        leads: parseInt(leads.rows[0].count),
        tasks: parseInt(tasks.rows[0].count),
        contacts: parseInt(contacts.rows[0].count),
        revenue: parseFloat(revenue.rows[0].total),
      },
      recentLeads: recentLeads.rows,
      recentTickets: recentTickets.rows,
      leadsByStage: leadsByStage.rows,
      page: 'dashboard',
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('pages/error', { error: err.message, page: 'dashboard' });
  }
});

module.exports = router;
