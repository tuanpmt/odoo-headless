require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const { requireAuth } = require('./middleware/auth');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'odoo-headless-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// Helper for views
app.use((req, res, next) => {
  res.locals.formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
  res.locals.formatMoney = (n) => n ? new Intl.NumberFormat('vi-VN').format(n) : '0';
  res.locals.getStageName = (stageJson) => {
    if (!stageJson) return '-';
    if (typeof stageJson === 'string') return stageJson;
    return stageJson.vi_VN || stageJson.en_US || '-';
  };
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', requireAuth, require('./routes/dashboard'));
app.use('/crm', requireAuth, require('./routes/crm'));
app.use('/tickets', requireAuth, require('./routes/tickets'));
app.use('/contacts', requireAuth, require('./routes/contacts'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Odoo Headless UI running on http://localhost:${PORT}`);
});
