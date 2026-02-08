require('dotenv').config();
const express = require('express');
const { createClient } = require('./index');

const app = express();
app.use(express.json());

// Initialize Odoo client
const odoo = createClient();

// Middleware to ensure authentication
const ensureAuth = async (req, res, next) => {
  try {
    await odoo.authenticate();
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
};

// Health check
app.get('/health', async (req, res) => {
  try {
    const version = await odoo.version();
    res.json({ status: 'ok', odoo: version });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== SCHEMA DISCOVERY ====================

app.get('/schema/:model', ensureAuth, async (req, res) => {
  try {
    const schema = await odoo.schema.getFullSchema(req.params.model);
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/schema/:model/fields', ensureAuth, async (req, res) => {
  try {
    const fields = await odoo.schema.getFields(req.params.model);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPDESK TICKETS ====================

app.get('/helpdesk/tickets', ensureAuth, async (req, res) => {
  try {
    const { offset = 0, limit = 100, team_id, closed } = req.query;
    const options = { offset: parseInt(offset), limit: parseInt(limit) };
    
    if (team_id) {
      options.domain = [['team_id', '=', parseInt(team_id)]];
    }
    if (closed !== undefined) {
      options.domain = [...(options.domain || []), ['closed', '=', closed === 'true']];
    }
    
    const tickets = await odoo.helpdesk.getTickets(options);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/helpdesk/tickets/:id', ensureAuth, async (req, res) => {
  try {
    const ticket = await odoo.helpdesk.getTicket(parseInt(req.params.id));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/helpdesk/tickets', ensureAuth, async (req, res) => {
  try {
    const id = await odoo.helpdesk.createTicket(req.body);
    const ticket = await odoo.helpdesk.getTicket(id);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/helpdesk/tickets/:id', ensureAuth, async (req, res) => {
  try {
    await odoo.helpdesk.updateTicket(parseInt(req.params.id), req.body);
    const ticket = await odoo.helpdesk.getTicket(parseInt(req.params.id));
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/helpdesk/tickets/:id', ensureAuth, async (req, res) => {
  try {
    await odoo.helpdesk.deleteTicket(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPDESK TEAMS ====================

app.get('/helpdesk/teams', ensureAuth, async (req, res) => {
  try {
    const teams = await odoo.helpdesk.getTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/helpdesk/teams/:id', ensureAuth, async (req, res) => {
  try {
    const team = await odoo.helpdesk.getTeam(parseInt(req.params.id));
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPDESK STAGES ====================

app.get('/helpdesk/stages', ensureAuth, async (req, res) => {
  try {
    const { team_id } = req.query;
    let stages;
    
    if (team_id) {
      stages = await odoo.helpdesk.getStagesForTeam(parseInt(team_id));
    } else {
      stages = await odoo.helpdesk.getStages();
    }
    
    res.json(stages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPDESK EXTRAS ====================

app.get('/helpdesk/tags', ensureAuth, async (req, res) => {
  try {
    const tags = await odoo.helpdesk.getTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/helpdesk/categories', ensureAuth, async (req, res) => {
  try {
    const categories = await odoo.helpdesk.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/helpdesk/channels', ensureAuth, async (req, res) => {
  try {
    const channels = await odoo.helpdesk.getChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GENERIC MODEL ACCESS ====================

app.post('/execute', ensureAuth, async (req, res) => {
  try {
    const { model, method, args = [], kwargs = {} } = req.body;
    const result = await odoo.execute(model, method, args, kwargs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Odoo Headless API running on port ${PORT}`);
});

module.exports = app;
