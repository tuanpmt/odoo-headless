const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'odoo_headless',
  user: process.env.DB_USER || 'odoo',
  password: process.env.DB_PASS || 'odoo',
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'odoo-headless-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Make db and user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  req.db = pool;
  next();
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Helper: parse Odoo JSONB name field
function parseName(jsonbName) {
  if (!jsonbName) return '';
  if (typeof jsonbName === 'string') {
    try {
      const obj = JSON.parse(jsonbName);
      return obj.en_US || obj.vi_VN || Object.values(obj)[0] || jsonbName;
    } catch { return jsonbName; }
  }
  if (typeof jsonbName === 'object') return jsonbName.en_US || jsonbName.vi_VN || Object.values(jsonbName)[0] || '';
  return String(jsonbName);
}

// Make helper available to templates
app.use((req, res, next) => {
  res.locals.parseName = parseName;
  next();
});

// ============ AUTH ============
const crypto = require('crypto');

function verifyPbkdf2(password, hash) {
  // Format: $pbkdf2-sha512$iterations$salt$key
  const parts = hash.split('$');
  if (parts.length !== 5) return false;
  const iterations = parseInt(parts[2]);
  // Salt and key are base64 with . instead of + (passlib format)
  const salt = Buffer.from(parts[3].replace(/\./g, '+') + '==', 'base64');
  const key = Buffer.from(parts[4].replace(/\./g, '+') + '==', 'base64');
  const derived = crypto.pbkdf2Sync(password, salt, iterations, key.length, 'sha512');
  return crypto.timingSafeEqual(derived, key);
}

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.id, u.login, u.password, p.name as partner_name
       FROM res_users u JOIN res_partner p ON u.partner_id = p.id
       WHERE u.login = $1 AND u.active = true`, [login]
    );
    if (result.rows.length === 0) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!verifyPbkdf2(password, user.password)) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, login: user.login, name: user.partner_name };
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ============ DASHBOARD ============
app.get('/', requireAuth, async (req, res) => {
  try {
    const [leads, tasks, contacts, wonLeads, openLeads] = await Promise.all([
      pool.query("SELECT count(*) FROM crm_lead WHERE active=true"),
      pool.query("SELECT count(*) FROM project_task WHERE project_id=5 AND active=true"),
      pool.query("SELECT count(*) FROM res_partner WHERE active=true"),
      pool.query("SELECT count(*) FROM crm_lead WHERE active=true AND stage_id=4"),
      pool.query("SELECT count(*) FROM crm_lead WHERE active=true AND stage_id IN (1,2,3)"),
    ]);
    const recentLeads = await pool.query(
      `SELECT cl.id, cl.name, cl.email_from, cl.expected_revenue, cs.name as stage_name, cl.priority, cl.create_date
       FROM crm_lead cl LEFT JOIN crm_stage cs ON cl.stage_id = cs.id
       WHERE cl.active=true ORDER BY cl.create_date DESC LIMIT 5`
    );
    const recentTasks = await pool.query(
      `SELECT pt.id, pt.name, pt.priority, pt.state, ptt.name as stage_name, pt.create_date
       FROM project_task pt LEFT JOIN project_task_type ptt ON pt.stage_id = ptt.id
       WHERE pt.project_id=5 AND pt.active=true ORDER BY pt.create_date DESC LIMIT 5`
    );
    res.render('dashboard', {
      stats: {
        leads: leads.rows[0].count,
        tasks: tasks.rows[0].count,
        contacts: contacts.rows[0].count,
        wonLeads: wonLeads.rows[0].count,
        openLeads: openLeads.rows[0].count,
      },
      recentLeads: recentLeads.rows,
      recentTasks: recentTasks.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
});

// ============ CRM ============
app.get('/crm', requireAuth, async (req, res) => {
  const search = req.query.q || '';
  const stageFilter = req.query.stage || '';
  let where = 'cl.active=true';
  const params = [];
  if (search) { params.push(`%${search}%`); where += ` AND (cl.name ILIKE $${params.length} OR cl.email_from ILIKE $${params.length} OR cl.partner_name ILIKE $${params.length})`; }
  if (stageFilter) { params.push(parseInt(stageFilter)); where += ` AND cl.stage_id = $${params.length}`; }
  
  const [leads, stages] = await Promise.all([
    pool.query(`SELECT cl.*, cs.name as stage_name FROM crm_lead cl LEFT JOIN crm_stage cs ON cl.stage_id=cs.id WHERE ${where} ORDER BY cl.create_date DESC LIMIT 100`, params),
    pool.query("SELECT id, name FROM crm_stage ORDER BY sequence"),
  ]);
  res.render('crm/index', { leads: leads.rows, stages: stages.rows, search, stageFilter });
});

app.get('/crm/new', requireAuth, async (req, res) => {
  const stages = await pool.query("SELECT id, name FROM crm_stage ORDER BY sequence");
  res.render('crm/form', { lead: null, stages: stages.rows });
});

app.get('/crm/:id', requireAuth, async (req, res) => {
  const [lead, stages] = await Promise.all([
    pool.query("SELECT cl.*, cs.name as stage_name FROM crm_lead cl LEFT JOIN crm_stage cs ON cl.stage_id=cs.id WHERE cl.id=$1", [req.params.id]),
    pool.query("SELECT id, name FROM crm_stage ORDER BY sequence"),
  ]);
  if (!lead.rows.length) return res.redirect('/crm');
  res.render('crm/form', { lead: lead.rows[0], stages: stages.rows });
});

app.post('/crm/save', requireAuth, async (req, res) => {
  const { id, name, partner_name, email_from, phone, expected_revenue, stage_id, priority, description } = req.body;
  const uid = req.session.user.id;
  try {
    if (id) {
      await pool.query(
        `UPDATE crm_lead SET name=$1, partner_name=$2, email_from=$3, phone=$4, expected_revenue=$5, stage_id=$6, priority=$7, description=$8, write_uid=$9, write_date=NOW() WHERE id=$10`,
        [name, partner_name, email_from, phone, expected_revenue || 0, stage_id, priority || '0', description, uid, id]
      );
      res.redirect(`/crm/${id}`);
    } else {
      const result = await pool.query(
        `INSERT INTO crm_lead (name, partner_name, email_from, phone, expected_revenue, stage_id, priority, description, type, active, user_id, create_uid, write_uid, create_date, write_date, probability, automated_probability, date_last_stage_update)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'lead',true,$9,$9,$9,NOW(),NOW(),10,10,NOW()) RETURNING id`,
        [name, partner_name, email_from, phone, expected_revenue || 0, stage_id || 1, priority || '0', description, uid]
      );
      res.redirect(`/crm/${result.rows[0].id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving lead');
  }
});

// ============ TICKETS ============
app.get('/tickets', requireAuth, async (req, res) => {
  const search = req.query.q || '';
  let where = 'pt.project_id=5 AND pt.active=true';
  const params = [];
  if (search) { params.push(`%${search}%`); where += ` AND (pt.name ILIKE $${params.length})`; }
  
  const [tasks, stages] = await Promise.all([
    pool.query(`SELECT pt.*, ptt.name as stage_name, rp.name as partner_name
      FROM project_task pt LEFT JOIN project_task_type ptt ON pt.stage_id=ptt.id LEFT JOIN res_partner rp ON pt.partner_id=rp.id
      WHERE ${where} ORDER BY pt.create_date DESC LIMIT 100`, params),
    pool.query("SELECT DISTINCT ptt.id, ptt.name, ptt.sequence FROM project_task_type ptt ORDER BY ptt.sequence"),
  ]);
  res.render('tickets/index', { tasks: tasks.rows, stages: stages.rows, search });
});

app.get('/tickets/new', requireAuth, async (req, res) => {
  const stages = await pool.query("SELECT id, name FROM project_task_type ORDER BY sequence");
  const partners = await pool.query("SELECT id, name FROM res_partner WHERE active=true ORDER BY name LIMIT 200");
  res.render('tickets/form', { task: null, stages: stages.rows, partners: partners.rows });
});

app.get('/tickets/:id', requireAuth, async (req, res) => {
  const [task, stages, partners] = await Promise.all([
    pool.query("SELECT pt.*, ptt.name as stage_name FROM project_task pt LEFT JOIN project_task_type ptt ON pt.stage_id=ptt.id WHERE pt.id=$1", [req.params.id]),
    pool.query("SELECT id, name FROM project_task_type ORDER BY sequence"),
    pool.query("SELECT id, name FROM res_partner WHERE active=true ORDER BY name LIMIT 200"),
  ]);
  if (!task.rows.length) return res.redirect('/tickets');
  res.render('tickets/form', { task: task.rows[0], stages: stages.rows, partners: partners.rows });
});

app.post('/tickets/save', requireAuth, async (req, res) => {
  const { id, name, description, priority, stage_id, partner_id, date_deadline } = req.body;
  const uid = req.session.user.id;
  try {
    if (id) {
      await pool.query(
        `UPDATE project_task SET name=$1, description=$2, priority=$3, stage_id=$4, partner_id=$5, date_deadline=$6, write_uid=$7, write_date=NOW() WHERE id=$8`,
        [name, description, priority || '0', stage_id, partner_id || null, date_deadline || null, uid, id]
      );
      res.redirect(`/tickets/${id}`);
    } else {
      const result = await pool.query(
        `INSERT INTO project_task (name, description, priority, stage_id, project_id, partner_id, date_deadline, active, state, display_in_project, create_uid, write_uid, create_date, write_date, date_last_stage_update)
         VALUES ($1,$2,$3,$4,5,$5,$6,true,'01_in_progress',true,$7,$7,NOW(),NOW(),NOW()) RETURNING id`,
        [name, description, priority || '0', stage_id || 19, partner_id || null, date_deadline || null, uid]
      );
      res.redirect(`/tickets/${result.rows[0].id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving ticket');
  }
});

// ============ CONTACTS ============
app.get('/contacts', requireAuth, async (req, res) => {
  const search = req.query.q || '';
  let where = 'active=true';
  const params = [];
  if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`; }
  
  const contacts = await pool.query(`SELECT id, name, email, phone, mobile, city, is_company, function, company_name, create_date FROM res_partner WHERE ${where} ORDER BY name LIMIT 100`, params);
  res.render('contacts/index', { contacts: contacts.rows, search });
});

app.get('/contacts/new', requireAuth, async (req, res) => {
  res.render('contacts/form', { contact: null });
});

app.get('/contacts/:id', requireAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM res_partner WHERE id=$1", [req.params.id]);
  if (!result.rows.length) return res.redirect('/contacts');
  res.render('contacts/form', { contact: result.rows[0] });
});

app.post('/contacts/save', requireAuth, async (req, res) => {
  const { id, name, email, phone, mobile, city, street, function: fn, company_name, is_company, comment } = req.body;
  const uid = req.session.user.id;
  const isComp = is_company === 'on';
  try {
    if (id) {
      await pool.query(
        `UPDATE res_partner SET name=$1, email=$2, phone=$3, mobile=$4, city=$5, street=$6, function=$7, company_name=$8, is_company=$9, comment=$10, write_uid=$11, write_date=NOW() WHERE id=$12`,
        [name, email, phone, mobile, city, street, fn, company_name, isComp, comment, uid, id]
      );
      res.redirect(`/contacts/${id}`);
    } else {
      const result = await pool.query(
        `INSERT INTO res_partner (name, email, phone, mobile, city, street, function, company_name, is_company, comment, active, partner_share, create_uid, write_uid, create_date, write_date, type, lang, customer_rank)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,$11,$11,NOW(),NOW(),'contact','en_US',1) RETURNING id`,
        [name, email, phone, mobile, city, street, fn, company_name, isComp, comment, uid]
      );
      res.redirect(`/contacts/${result.rows[0].id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving contact');
  }
});

// Start
app.listen(PORT, () => {
  console.log(`Odoo Headless App running on port ${PORT}`);
});
