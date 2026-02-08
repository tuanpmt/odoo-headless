const OdooClient = require('./client');
const SchemaDiscovery = require('./schema-discovery');
const adapters = require('./adapters');

/**
 * Create a configured Odoo client with adapters
 * @param {Object} options - Connection options
 * @returns {Object} Client with adapters attached
 */
function createClient(options = {}) {
  const client = new OdooClient(options);
  
  return {
    // Core client
    client,
    
    // Schema discovery
    schema: new SchemaDiscovery(client),
    
    // Adapters
    helpdesk: new adapters.HelpdeskAdapter(client),
    crm: new adapters.CRMAdapter(client),
    pos: new adapters.POSAdapter(client),
    account: new adapters.AccountAdapter(client),
    
    // Convenience methods
    authenticate: () => client.authenticate(),
    execute: (...args) => client.execute(...args),
    searchRead: (...args) => client.searchRead(...args),
    create: (...args) => client.create(...args),
    write: (...args) => client.write(...args),
    unlink: (...args) => client.unlink(...args),
    version: () => client.version()
  };
}

module.exports = {
  OdooClient,
  SchemaDiscovery,
  ...adapters,
  createClient
};
