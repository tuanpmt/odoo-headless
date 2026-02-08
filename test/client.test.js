const { describe, it, before, after, mock } = require('node:test');
const assert = require('node:assert');

// Mock xmlrpc before requiring client
const mockMethodCall = mock.fn((method, args, callback) => {
  if (method === 'authenticate') {
    callback(null, 1); // Return uid = 1
  } else if (method === 'execute_kw') {
    const [db, uid, password, model, methodName, methodArgs] = args;
    
    if (methodName === 'search_read') {
      callback(null, [
        { id: 1, name: 'Test Record' },
        { id: 2, name: 'Test Record 2' }
      ]);
    } else if (methodName === 'create') {
      callback(null, 3);
    } else if (methodName === 'write') {
      callback(null, true);
    } else if (methodName === 'unlink') {
      callback(null, true);
    } else if (methodName === 'fields_get') {
      callback(null, {
        id: { type: 'integer', string: 'ID' },
        name: { type: 'char', string: 'Name', required: true }
      });
    } else {
      callback(null, []);
    }
  } else if (method === 'version') {
    callback(null, { server_version: '17.0' });
  } else {
    callback(new Error('Unknown method'));
  }
});

mock.module('xmlrpc', {
  namedExports: {
    createClient: () => ({ methodCall: mockMethodCall }),
    createSecureClient: () => ({ methodCall: mockMethodCall })
  }
});

const OdooClient = require('../src/client');
const SchemaDiscovery = require('../src/schema-discovery');
const { HelpdeskAdapter } = require('../src/adapters');

describe('OdooClient', () => {
  let client;

  before(() => {
    client = new OdooClient({
      url: 'http://localhost:8069',
      db: 'test',
      username: 'admin',
      password: 'admin'
    });
  });

  it('should authenticate successfully', async () => {
    const uid = await client.authenticate();
    assert.strictEqual(uid, 1);
  });

  it('should get version', async () => {
    const version = await client.version();
    assert.strictEqual(version.server_version, '17.0');
  });

  it('should search and read records', async () => {
    const records = await client.searchRead('res.partner', [], { limit: 10 });
    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[0].name, 'Test Record');
  });

  it('should create a record', async () => {
    const id = await client.create('res.partner', { name: 'New Partner' });
    assert.strictEqual(id, 3);
  });

  it('should update a record', async () => {
    const result = await client.write('res.partner', [1], { name: 'Updated' });
    assert.strictEqual(result, true);
  });

  it('should delete a record', async () => {
    const result = await client.unlink('res.partner', [1]);
    assert.strictEqual(result, true);
  });
});

describe('SchemaDiscovery', () => {
  let client;
  let schema;

  before(async () => {
    client = new OdooClient({
      url: 'http://localhost:8069',
      db: 'test',
      username: 'admin',
      password: 'admin'
    });
    schema = new SchemaDiscovery(client);
  });

  it('should get fields for a model', async () => {
    const fields = await schema.getFields('res.partner');
    assert.ok(fields.id);
    assert.ok(fields.name);
    assert.strictEqual(fields.name.type, 'char');
  });

  it('should get required fields', async () => {
    const required = await schema.getRequiredFields('res.partner');
    assert.ok(required.name);
  });

  it('should get field names', async () => {
    const names = await schema.getFieldNames('res.partner');
    assert.ok(names.includes('id'));
    assert.ok(names.includes('name'));
  });
});

describe('HelpdeskAdapter', () => {
  let client;
  let helpdesk;

  before(async () => {
    client = new OdooClient({
      url: 'http://localhost:8069',
      db: 'test',
      username: 'admin',
      password: 'admin'
    });
    helpdesk = new HelpdeskAdapter(client);
  });

  it('should get tickets', async () => {
    const tickets = await helpdesk.getTickets();
    assert.ok(Array.isArray(tickets));
  });

  it('should create a ticket', async () => {
    const id = await helpdesk.createTicket({
      name: 'Test Ticket',
      description: 'Test description'
    });
    assert.strictEqual(id, 3);
  });

  it('should update a ticket', async () => {
    const result = await helpdesk.updateTicket(1, { priority: '2' });
    assert.strictEqual(result, true);
  });

  it('should get teams', async () => {
    const teams = await helpdesk.getTeams();
    assert.ok(Array.isArray(teams));
  });

  it('should get stages', async () => {
    const stages = await helpdesk.getStages();
    assert.ok(Array.isArray(stages));
  });
});
