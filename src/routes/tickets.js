const express = require('express');
const pool = require('../config/db');
const router = express.Router();

const PROJECT_ID = 5;

router.get('/', async (req, res) => {
  try {
    const { search, stage, priority, page: pg } = req.query;
    const page = parseInt(pg) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    let where = [`t.project_id = ${PROJECT_ID}`, 't.active = true'];
    let params = [];
    let pi = 1;

    if (search) {
      where.push(`(t.name ILIKE $${pi} OR p.name ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }
    if (stage) {
      where.push(`t.stage_id = $${pi}`);
      params.push(parseInt(stage));
      pi++;
    }
    if (priority) {
      where.push(`t.priority = $${pi}`);
      params.push(priority);
      pi++;
    }

    const whereClause = where.join(' AND ');

    const [countRes, tasksRes, stagesRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM project_task t LEFT JOIN res_partner p ON t.partner_id=p.id WHERE ${whereClause}`, params),
      pool.query(`
        SELECT t.id, t.name, t.priority, t.state, t.stage_id, t.date_deadline,
               t.create_date, t.date_last_stage_update,
               ptt.name as stage_name, p.name as partner_name
        FROM project_task t
        LEFT JOIN project_task_type ptt ON t.stage_id = ptt.id
        LEFT JOIN res_partner p ON t.partner_id = p.id
        WHERE ${whereClause}
        ORDER BY t.create_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `, params),
      pool.query(`
        SELECT DISTINCT ptt.id, ptt.name, ptt.sequence 
        FROM project_task_type ptt 
        JOIN project_task_type_rel pttr ON ptt.id = pttr.type_id 
        WHERE pttr.project_id = ${PROJECT_ID} 
        ORDER BY ptt.sequence
      `),
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.render('pages/tickets/list', {
      tasks: tasksRes.rows,
      stages: stagesRes.rows,
      filters: { search, stage, priority },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      page: 'tickets',
    });
  } catch (err) {
    console.error('Tickets list error:', err);
    res.status(500).render('pages/error', { error: err.message, page: 'tickets' });
  }
});

router.get('/create', async (req, res) => {
  const [stages, partners] = await Promise.all([
    pool.query(`SELECT DISTINCT ptt.id, ptt.name, ptt.sequence FROM project_task_type ptt JOIN project_task_type_rel pttr ON ptt.id=pttr.type_id WHERE pttr.project_id=${PROJECT_ID} ORDER BY ptt.sequence`),
    pool.query(`SELECT id, name FROM res_partner WHERE active=true ORDER BY name LIMIT 200`),
  ]);
  res.render('pages/tickets/form', { task: null, stages: stages.rows, partners: partners.rows, page: 'tickets' });
});

router.post('/create', async (req, res) => {
  try {
    const { name, partner_id, priority, stage_id, description, date_deadline } = req.body;
    await pool.query(`
      INSERT INTO project_task (name, project_id, partner_id, priority, stage_id, description, date_deadline, active, state, create_uid, write_uid, create_date, write_date, company_id, display_in_project, sequence)
      VALUES ($1, ${PROJECT_ID}, $2, $3, $4, $5, $6, true, '01_in_progress', $7, $7, NOW(), NOW(), 1, true, 10)
    `, [name, parseInt(partner_id)||null, priority||'0', parseInt(stage_id)||19, description||null, date_deadline||null, req.session.user.id]);
    res.redirect('/tickets');
  } catch (err) {
    console.error('Ticket create error:', err);
    res.redirect('/tickets?error=create');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await pool.query(`
      SELECT t.*, ptt.name as stage_name, p.name as partner_name
      FROM project_task t
      LEFT JOIN project_task_type ptt ON t.stage_id = ptt.id
      LEFT JOIN res_partner p ON t.partner_id = p.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (!task.rows.length) return res.redirect('/tickets');
    
    const [stages, partners] = await Promise.all([
      pool.query(`SELECT DISTINCT ptt.id, ptt.name, ptt.sequence FROM project_task_type ptt JOIN project_task_type_rel pttr ON ptt.id=pttr.type_id WHERE pttr.project_id=${PROJECT_ID} ORDER BY ptt.sequence`),
      pool.query(`SELECT id, name FROM res_partner WHERE active=true ORDER BY name LIMIT 200`),
    ]);
    res.render('pages/tickets/form', { task: task.rows[0], stages: stages.rows, partners: partners.rows, page: 'tickets' });
  } catch (err) {
    console.error('Ticket detail error:', err);
    res.redirect('/tickets');
  }
});

router.post('/:id', async (req, res) => {
  try {
    const { name, partner_id, priority, stage_id, description, date_deadline } = req.body;
    await pool.query(`
      UPDATE project_task SET name=$1, partner_id=$2, priority=$3, stage_id=$4, 
        description=$5, date_deadline=$6, write_uid=$7, write_date=NOW(), date_last_stage_update=NOW()
      WHERE id=$8
    `, [name, parseInt(partner_id)||null, priority||'0', parseInt(stage_id)||19, description||null, date_deadline||null, req.session.user.id, req.params.id]);
    res.redirect('/tickets');
  } catch (err) {
    console.error('Ticket update error:', err);
    res.redirect(`/tickets/${req.params.id}?error=update`);
  }
});

module.exports = router;
