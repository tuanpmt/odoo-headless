/**
 * CRM Adapter - Placeholder for CRM module (leads, opportunities)
 */

class CRMAdapter {
  constructor(client) {
    this.client = client;
    this.models = {
      lead: 'crm.lead',
      stage: 'crm.stage',
      team: 'crm.team',
      tag: 'crm.tag'
    };
  }

  // ==================== LEADS/OPPORTUNITIES ====================

  /**
   * Get leads/opportunities
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getLeads(options = {}) {
    const {
      domain = [],
      fields = ['id', 'name', 'partner_id', 'email_from', 'phone', 'stage_id', 'user_id', 'team_id', 'expected_revenue', 'probability'],
      offset = 0,
      limit = 100,
      order = 'id desc'
    } = options;

    return this.client.searchRead(this.models.lead, domain, { fields, offset, limit, order });
  }

  /**
   * Get opportunities only (type = 'opportunity')
   */
  async getOpportunities(options = {}) {
    const domain = [['type', '=', 'opportunity'], ...(options.domain || [])];
    return this.getLeads({ ...options, domain });
  }

  /**
   * Create a lead
   * @param {Object} values - Lead values
   * @returns {Promise<number>}
   */
  async createLead(values) {
    return this.client.create(this.models.lead, { type: 'lead', ...values });
  }

  /**
   * Create an opportunity
   * @param {Object} values - Opportunity values
   * @returns {Promise<number>}
   */
  async createOpportunity(values) {
    return this.client.create(this.models.lead, { type: 'opportunity', ...values });
  }

  /**
   * Update a lead/opportunity
   * @param {number} id - Lead ID
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>}
   */
  async updateLead(id, values) {
    return this.client.write(this.models.lead, [id], values);
  }

  /**
   * Convert lead to opportunity
   * @param {number} leadId - Lead ID
   * @returns {Promise<boolean>}
   */
  async convertToOpportunity(leadId) {
    return this.updateLead(leadId, { type: 'opportunity' });
  }

  // ==================== STAGES ====================

  async getStages() {
    return this.client.searchRead(this.models.stage, [], { 
      fields: ['id', 'name', 'sequence', 'is_won'],
      order: 'sequence' 
    });
  }

  // ==================== TEAMS ====================

  async getTeams() {
    return this.client.searchRead(this.models.team, [], { 
      fields: ['id', 'name', 'user_id', 'member_ids'] 
    });
  }
}

module.exports = CRMAdapter;
