# Odoo Headless

Headless Odoo client with XML-RPC support and REST API. Designed for integrating Odoo ERP with external applications.

## Features

- 🔌 XML-RPC client for Odoo
- 🔍 Auto schema discovery via `fields_get`
- 🎫 Helpdesk adapter (OCA helpdesk_mgmt)
- 💼 CRM adapter (leads, opportunities)
- 🛒 POS adapter (orders, sessions)
- 💰 Accounting adapter (invoices, payments)
- 🌐 Express REST API

## Installation

```bash
npm install
cp .env.example .env
# Edit .env with your Odoo credentials
```

## Configuration

```env
ODOO_URL=http://localhost:8069
ODOO_DB=odoo
ODOO_USER=admin
ODOO_PASSWORD=admin
PORT=3000
```

## Usage

### As a Library

```javascript
const { createClient } = require('odoo-headless');

const odoo = createClient({
  url: 'http://localhost:8069',
  db: 'mydb',
  username: 'admin',
  password: 'secret'
});

// Authenticate
await odoo.authenticate();

// Use helpdesk adapter
const tickets = await odoo.helpdesk.getTickets();
const newId = await odoo.helpdesk.createTicket({
  name: 'Server down',
  description: '<p>Production server is not responding</p>',
  priority: '3'
});

// Schema discovery
const schema = await odoo.schema.getFullSchema('helpdesk.ticket');

// Direct execute
const partners = await odoo.execute('res.partner', 'search_read', 
  [[['is_company', '=', true]]], 
  { fields: ['name', 'email'], limit: 10 }
);
```

### As REST API

```bash
npm start
```

#### Endpoints

**Health & Schema**
- `GET /health` - Check connection
- `GET /schema/:model` - Get full model schema
- `GET /schema/:model/fields` - Get model fields

**Helpdesk**
- `GET /helpdesk/tickets` - List tickets
- `GET /helpdesk/tickets/:id` - Get ticket
- `POST /helpdesk/tickets` - Create ticket
- `PUT /helpdesk/tickets/:id` - Update ticket
- `DELETE /helpdesk/tickets/:id` - Delete ticket
- `GET /helpdesk/teams` - List teams
- `GET /helpdesk/stages` - List stages
- `GET /helpdesk/tags` - List tags
- `GET /helpdesk/categories` - List categories

**Generic**
- `POST /execute` - Execute any Odoo method

#### Examples

```bash
# Get tickets
curl http://localhost:3000/helpdesk/tickets

# Get open tickets
curl "http://localhost:3000/helpdesk/tickets?closed=false"

# Create ticket
curl -X POST http://localhost:3000/helpdesk/tickets \
  -H "Content-Type: application/json" \
  -d '{"name": "Bug report", "description": "<p>Details here</p>"}'

# Update ticket
curl -X PUT http://localhost:3000/helpdesk/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"priority": "3", "stage_id": 2}'

# Get schema
curl http://localhost:3000/schema/helpdesk.ticket

# Execute custom method
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"model": "res.partner", "method": "search_read", "args": [[]], "kwargs": {"limit": 5}}'
```

## Adapters

### Helpdesk (OCA helpdesk_mgmt)

```javascript
// Tickets
await odoo.helpdesk.getTickets({ limit: 50 });
await odoo.helpdesk.getOpenTickets();
await odoo.helpdesk.getTicketsByTeam(teamId);
await odoo.helpdesk.createTicket({ name, description, team_id, priority });
await odoo.helpdesk.updateTicket(id, { stage_id, priority });
await odoo.helpdesk.assignTicket(ticketId, userId);
await odoo.helpdesk.changeStage(ticketId, stageId);
await odoo.helpdesk.setPriority(ticketId, '3');

// Teams & Stages
await odoo.helpdesk.getTeams();
await odoo.helpdesk.getStages();
await odoo.helpdesk.getStagesForTeam(teamId);
```

### Schema Discovery

```javascript
// Get all fields
const fields = await odoo.schema.getFields('helpdesk.ticket');

// Get required fields only
const required = await odoo.schema.getRequiredFields('helpdesk.ticket');

// Get relational fields
const relations = await odoo.schema.getRelationalFields('helpdesk.ticket');

// Get selection fields with options
const selections = await odoo.schema.getSelectionFields('helpdesk.ticket');

// Check if model exists
const exists = await odoo.schema.modelExists('custom.model');
```

## OCA Helpdesk Schema

The `schemas/helpdesk.json` file contains the extracted schema from OCA helpdesk_mgmt module (v18.0):

- `helpdesk.ticket` - Support tickets
- `helpdesk.ticket.team` - Support teams
- `helpdesk.ticket.stage` - Ticket stages/workflow

## Testing

```bash
npm test
```

## License

MIT
