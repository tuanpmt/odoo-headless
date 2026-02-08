/**
 * Schema Discovery - Auto-discover Odoo model fields via fields_get
 */

class SchemaDiscovery {
  constructor(client) {
    this.client = client;
    this.cache = new Map();
  }

  /**
   * Get all fields of a model
   * @param {string} model - Model name (e.g., 'helpdesk.ticket')
   * @param {string[]} attributes - Field attributes to return
   * @returns {Promise<Object>} Field definitions
   */
  async getFields(model, attributes = ['string', 'type', 'help', 'required', 'readonly', 'selection', 'relation']) {
    const cacheKey = `${model}:${attributes.join(',')}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fields = await this.client.execute(model, 'fields_get', [], { attributes });
    this.cache.set(cacheKey, fields);
    return fields;
  }

  /**
   * Get field names only
   * @param {string} model - Model name
   * @returns {Promise<string[]>}
   */
  async getFieldNames(model) {
    const fields = await this.getFields(model, ['string']);
    return Object.keys(fields);
  }

  /**
   * Get required fields
   * @param {string} model - Model name
   * @returns {Promise<Object>}
   */
  async getRequiredFields(model) {
    const fields = await this.getFields(model);
    const required = {};
    
    for (const [name, def] of Object.entries(fields)) {
      if (def.required) {
        required[name] = def;
      }
    }
    
    return required;
  }

  /**
   * Get relational fields
   * @param {string} model - Model name
   * @returns {Promise<Object>}
   */
  async getRelationalFields(model) {
    const fields = await this.getFields(model);
    const relational = {};
    
    for (const [name, def] of Object.entries(fields)) {
      if (['many2one', 'one2many', 'many2many'].includes(def.type)) {
        relational[name] = {
          ...def,
          relation: def.relation
        };
      }
    }
    
    return relational;
  }

  /**
   * Get selection fields with their options
   * @param {string} model - Model name
   * @returns {Promise<Object>}
   */
  async getSelectionFields(model) {
    const fields = await this.getFields(model);
    const selections = {};
    
    for (const [name, def] of Object.entries(fields)) {
      if (def.type === 'selection' && def.selection) {
        selections[name] = {
          string: def.string,
          options: def.selection
        };
      }
    }
    
    return selections;
  }

  /**
   * Check if model exists
   * @param {string} model - Model name
   * @returns {Promise<boolean>}
   */
  async modelExists(model) {
    try {
      await this.getFields(model, ['string']);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get full schema with metadata
   * @param {string} model - Model name
   * @returns {Promise<Object>}
   */
  async getFullSchema(model) {
    const fields = await this.getFields(model);
    
    return {
      model,
      fields,
      required: Object.keys(fields).filter(f => fields[f].required),
      relational: Object.keys(fields).filter(f => 
        ['many2one', 'one2many', 'many2many'].includes(fields[f].type)
      ),
      selections: Object.keys(fields).filter(f => fields[f].type === 'selection')
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = SchemaDiscovery;
