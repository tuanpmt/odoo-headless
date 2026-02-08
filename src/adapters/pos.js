/**
 * POS Adapter - Placeholder for Point of Sale module
 */

class POSAdapter {
  constructor(client) {
    this.client = client;
    this.models = {
      order: 'pos.order',
      orderLine: 'pos.order.line',
      session: 'pos.session',
      config: 'pos.config',
      payment: 'pos.payment'
    };
  }

  // ==================== ORDERS ====================

  /**
   * Get POS orders
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getOrders(options = {}) {
    const {
      domain = [],
      fields = ['id', 'name', 'date_order', 'partner_id', 'amount_total', 'state', 'session_id', 'user_id'],
      offset = 0,
      limit = 100,
      order = 'date_order desc'
    } = options;

    return this.client.searchRead(this.models.order, domain, { fields, offset, limit, order });
  }

  /**
   * Get order lines for an order
   * @param {number} orderId - Order ID
   * @returns {Promise<Object[]>}
   */
  async getOrderLines(orderId) {
    return this.client.searchRead(this.models.orderLine, [['order_id', '=', orderId]], {
      fields: ['id', 'product_id', 'qty', 'price_unit', 'price_subtotal', 'discount']
    });
  }

  // ==================== SESSIONS ====================

  /**
   * Get POS sessions
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getSessions(options = {}) {
    const {
      domain = [],
      fields = ['id', 'name', 'config_id', 'user_id', 'start_at', 'stop_at', 'state'],
      offset = 0,
      limit = 100
    } = options;

    return this.client.searchRead(this.models.session, domain, { fields, offset, limit });
  }

  /**
   * Get open sessions
   * @returns {Promise<Object[]>}
   */
  async getOpenSessions() {
    return this.getSessions({ domain: [['state', '=', 'opened']] });
  }

  // ==================== CONFIG ====================

  /**
   * Get POS configurations
   * @returns {Promise<Object[]>}
   */
  async getConfigs() {
    return this.client.searchRead(this.models.config, [], {
      fields: ['id', 'name', 'active', 'current_session_id', 'pricelist_id']
    });
  }
}

module.exports = POSAdapter;
