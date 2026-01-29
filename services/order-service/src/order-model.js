const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "order-db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "orders"
});

module.exports = {
  async ping() {
    try {
      await pool.query("SELECT 1");
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
