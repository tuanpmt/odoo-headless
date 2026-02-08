/**
 * Helpdesk Adapter - CRUD operations for OCA helpdesk_mgmt
 */

class HelpdeskAdapter {
  constructor(client) {
    this.client = client;
    this.models = {
      ticket: 'helpdesk.ticket',
      team: 'helpdesk.ticket.team',
      stage: 'helpdesk.ticket.stage',
      tag: 'helpdesk.ticket.tag',
      category: 'helpdesk.ticket.category',
      channel: 'helpdesk.ticket.channel'
    };
  }

  // ==================== TICKETS ====================

  /**
   * Get tickets with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getTickets(options = {}) {
    const {
      domain = [],
      fields = ['id', 'number', 'name', 'description', 'user_id', 'team_id', 'stage_id', 'priority', 'partner_id', 'partner_email', 'closed', 'create_date'],
      offset = 0,
      limit = 100,
      order = 'priority desc, id desc'
    } = options;

    return this.client.searchRead(this.models.ticket, domain, { fields, offset, limit, order });
  }

  /**
   * Get single ticket by ID
   * @param {number} id - Ticket ID
   * @param {string[]} fields - Fields to return
   * @returns {Promise<Object|null>}
   */
  async getTicket(id, fields = []) {
    const tickets = await this.client.read(this.models.ticket, [id], fields);
    return tickets.length > 0 ? tickets[0] : null;
  }

  /**
   * Get tickets by team
   * @param {number} teamId - Team ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object[]>}
   */
  async getTicketsByTeam(teamId, options = {}) {
    const domain = [['team_id', '=', teamId], ...(options.domain || [])];
    return this.getTickets({ ...options, domain });
  }

  /**
   * Get open tickets (not closed)
   * @param {Object} options - Additional options
   * @returns {Promise<Object[]>}
   */
  async getOpenTickets(options = {}) {
    const domain = [['closed', '=', false], ...(options.domain || [])];
    return this.getTickets({ ...options, domain });
  }

  /**
   * Create a new ticket
   * @param {Object} values - Ticket values
   * @returns {Promise<number>} New ticket ID
   */
  async createTicket(values) {
    const ticketData = {
      name: values.name,
      description: values.description || '',
      ...values
    };

    // Remove undefined values
    Object.keys(ticketData).forEach(key => 
      ticketData[key] === undefined && delete ticketData[key]
    );

    return this.client.create(this.models.ticket, ticketData);
  }

  /**
   * Update a ticket
   * @param {number} id - Ticket ID
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>}
   */
  async updateTicket(id, values) {
    return this.client.write(this.models.ticket, [id], values);
  }

  /**
   * Update multiple tickets
   * @param {number[]} ids - Ticket IDs
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>}
   */
  async updateTickets(ids, values) {
    return this.client.write(this.models.ticket, ids, values);
  }

  /**
   * Delete a ticket
   * @param {number} id - Ticket ID
   * @returns {Promise<boolean>}
   */
  async deleteTicket(id) {
    return this.client.unlink(this.models.ticket, [id]);
  }

  /**
   * Assign ticket to user
   * @param {number} ticketId - Ticket ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  async assignTicket(ticketId, userId) {
    return this.updateTicket(ticketId, { user_id: userId });
  }

  /**
   * Change ticket stage
   * @param {number} ticketId - Ticket ID
   * @param {number} stageId - Stage ID
   * @returns {Promise<boolean>}
   */
  async changeStage(ticketId, stageId) {
    return this.updateTicket(ticketId, { stage_id: stageId });
  }

  /**
   * Set ticket priority
   * @param {number} ticketId - Ticket ID
   * @param {string} priority - Priority ('0'=Low, '1'=Medium, '2'=High, '3'=Very High)
   * @returns {Promise<boolean>}
   */
  async setPriority(ticketId, priority) {
    return this.updateTicket(ticketId, { priority });
  }

  /**
   * Count tickets
   * @param {Array} domain - Search domain
   * @returns {Promise<number>}
   */
  async countTickets(domain = []) {
    return this.client.searchCount(this.models.ticket, domain);
  }

  // ==================== TEAMS ====================

  /**
   * Get all teams
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getTeams(options = {}) {
    const {
      domain = [],
      fields = ['id', 'name', 'user_ids', 'user_id', 'active', 'todo_ticket_count', 'company_id'],
      offset = 0,
      limit = 100,
      order = 'sequence, id'
    } = options;

    return this.client.searchRead(this.models.team, domain, { fields, offset, limit, order });
  }

  /**
   * Get single team by ID
   * @param {number} id - Team ID
   * @param {string[]} fields - Fields to return
   * @returns {Promise<Object|null>}
   */
  async getTeam(id, fields = []) {
    const teams = await this.client.read(this.models.team, [id], fields);
    return teams.length > 0 ? teams[0] : null;
  }

  /**
   * Create a team
   * @param {Object} values - Team values
   * @returns {Promise<number>}
   */
  async createTeam(values) {
    return this.client.create(this.models.team, values);
  }

  /**
   * Update a team
   * @param {number} id - Team ID
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>}
   */
  async updateTeam(id, values) {
    return this.client.write(this.models.team, [id], values);
  }

  // ==================== STAGES ====================

  /**
   * Get all stages
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getStages(options = {}) {
    const {
      domain = [],
      fields = ['id', 'name', 'sequence', 'closed', 'fold', 'unattended', 'team_ids'],
      offset = 0,
      limit = 100,
      order = 'sequence, id'
    } = options;

    return this.client.searchRead(this.models.stage, domain, { fields, offset, limit, order });
  }

  /**
   * Get stages for a specific team
   * @param {number} teamId - Team ID
   * @returns {Promise<Object[]>}
   */
  async getStagesForTeam(teamId) {
    const domain = ['|', ['team_ids', '=', false], ['team_ids', '=', teamId]];
    return this.getStages({ domain });
  }

  /**
   * Get single stage by ID
   * @param {number} id - Stage ID
   * @param {string[]} fields - Fields to return
   * @returns {Promise<Object|null>}
   */
  async getStage(id, fields = []) {
    const stages = await this.client.read(this.models.stage, [id], fields);
    return stages.length > 0 ? stages[0] : null;
  }

  /**
   * Create a stage
   * @param {Object} values - Stage values
   * @returns {Promise<number>}
   */
  async createStage(values) {
    return this.client.create(this.models.stage, values);
  }

  /**
   * Update a stage
   * @param {number} id - Stage ID
   * @param {Object} values - Values to update
   * @returns {Promise<boolean>}
   */
  async updateStage(id, values) {
    return this.client.write(this.models.stage, [id], values);
  }

  // ==================== TAGS ====================

  /**
   * Get all tags
   * @returns {Promise<Object[]>}
   */
  async getTags() {
    return this.client.searchRead(this.models.tag, [], { fields: ['id', 'name', 'color'] });
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all categories
   * @returns {Promise<Object[]>}
   */
  async getCategories() {
    return this.client.searchRead(this.models.category, [], { fields: ['id', 'name'] });
  }

  // ==================== CHANNELS ====================

  /**
   * Get all channels
   * @returns {Promise<Object[]>}
   */
  async getChannels() {
    return this.client.searchRead(this.models.channel, [], { fields: ['id', 'name'] });
  }
}

module.exports = HelpdeskAdapter;
