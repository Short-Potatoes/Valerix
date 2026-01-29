const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "order-db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "orders",
  connectionTimeoutMillis: 5000, // Wait max 5s to establish connection
  query_timeout: 10000, // Wait max 10s for query to complete
  statement_timeout: 10000, // Server-side timeout
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  allowExitOnIdle: true
});

module.exports = {
  async ping() {
    try {
      // Fast timeout for health checks (2 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 2000)
      );
      
      await Promise.race([
        pool.query("SELECT 1"),
        timeoutPromise
      ]);
      return true;
    } catch {
      return false;
    }
  },
  async createOrder(order) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        "INSERT INTO orders (id, customer_id, status, total_amount, created_at) VALUES ($1, $2, $3, $4, NOW())",
        [order.id, order.customerId, order.status, order.totalAmount]
      );

      for (const i of order.items) {
        await client.query(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
          [order.id, i.productId, i.qty, i.unitPrice]
        );
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
