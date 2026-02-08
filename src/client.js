const xmlrpc = require('xmlrpc');
const { URL } = require('url');

class OdooClient {
  constructor(options = {}) {
    this.url = options.url || process.env.ODOO_URL || 'http://localhost:8069';
    this.db = options.db || process.env.ODOO_DB;
    this.username = options.username || process.env.ODOO_USER;
    this.password = options.password || process.env.ODOO_PASSWORD;
    this.uid = null;
    
    const parsedUrl = new URL(this.url);
    const isSecure = parsedUrl.protocol === 'https:';
    const port = parsedUrl.port || (isSecure ? 443 : 80);
    
    const clientOptions = {
      host: parsedUrl.hostname,
      port: parseInt(port),
      path: '/xmlrpc/2/common'
    };
    
    this.commonClient = isSecure 
      ? xmlrpc.createSecureClient(clientOptions)
      : xmlrpc.createClient(clientOptions);
    
    this.objectClient = isSecure
      ? xmlrpc.createSecureClient({ ...clientOptions, path: '/xmlrpc/2/object' })
      : xmlrpc.createClient({ ...clientOptions, path: '/xmlrpc/2/object' });
  }

  /**
   * Authenticate with Odoo
   * @returns {Promise<number>} User ID
   */
  async authenticate() {
    return new Promise((resolve, reject) => {
      this.commonClient.methodCall(
        'authenticate',
        [this.db, this.username, this.password, {}],
        (error, uid) => {
          if (error) {
            reject(new Error(`Authentication failed: ${error.message}`));
          } else if (!uid) {
            reject(new Error('Authentication failed: Invalid credentials'));
          } else {
            this.uid = uid;
            resolve(uid);
          }
        }
      );
    });
  }

  /**
   * Check if connected
   */
  async ensureAuthenticated() {
    if (!this.uid) {
      await this.authenticate();
    }
    return this.uid;
  }

  /**
   * Execute a method on an Odoo model
   * @param {string} model - Model name (e.g., 'helpdesk.ticket')
   * @param {string} method - Method name (e.g., 'search_read')
   * @param {Array} args - Positional arguments
   * @param {Object} kwargs - Keyword arguments
   * @returns {Promise<any>}
   */
  async execute(model, method, args = [], kwargs = {}) {
    await this.ensureAuthenticated();
    
    return new Promise((resolve, reject) => {
      this.objectClient.methodCall(
        'execute_kw',
        [this.db, this.uid, this.password, model, method, args, kwargs],
        (error, result) => {
          if (error) {
            reject(new Error(`Execute failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  /**
   * Search records
   * @param {string} model - Model name
   * @param {Array} domain - Search domain
   * @param {Object} options - Additional options (offset, limit, order)
   * @returns {Promise<number[]>} Record IDs
   */
  async search(model, domain = [], options = {}) {
    return this.execute(model, 'search', [domain], options);
  }

  /**
   * Read records by IDs
   * @param {string} model - Model name
   * @param {number[]} ids - Record IDs
   * @param {string[]} fields - Fields to read
   * @returns {Promise<Object[]>}
   */
  async read(model, ids, fields = []) {
    return this.execute(model, 'read', [ids], { fields });
  }

  /**
   * Search and read records
   * @param {string} model - Model name
   * @param {Array} domain - Search domain
   * @param {Object} options - Options (fields, offset, limit, order)
   * @returns {Promise<Object[]>}
   */
  async searchRead(model, domain = [], options = {}) {
    const { fields = [], offset = 0, limit = null, order = null } = options;
    return this.execute(model, 'search_read', [domain], { fields, offset, limit, order });
  }

  /**
   * Create a new record
   * @param {string} model - Model name
   * @param {Object} values - Field values
   * @returns {Promise<number>} New record ID
   */
  async create(model, values) {
    return this.execute(model, 'create', [values]);
  }

  /**
   * Update records
   * @param {string} model - Model name
   * @param {number[]} ids - Record IDs
   * @param {Object} values - Field values to update
   * @returns {Promise<boolean>}
   */
  async write(model, ids, values) {
    return this.execute(model, 'write', [ids, values]);
  }

  /**
   * Delete records
   * @param {string} model - Model name
   * @param {number[]} ids - Record IDs
   * @returns {Promise<boolean>}
   */
  async unlink(model, ids) {
    return this.execute(model, 'unlink', [ids]);
  }

  /**
   * Count records matching domain
   * @param {string} model - Model name
   * @param {Array} domain - Search domain
   * @returns {Promise<number>}
   */
  async searchCount(model, domain = []) {
    return this.execute(model, 'search_count', [domain]);
  }

  /**
   * Get server version info
   * @returns {Promise<Object>}
   */
  async version() {
    return new Promise((resolve, reject) => {
      this.commonClient.methodCall('version', [], (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = OdooClient;
