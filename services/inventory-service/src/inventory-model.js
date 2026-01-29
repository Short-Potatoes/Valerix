const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "inventory-db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "inventory"
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
  async reserve(items) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const reservedDetails = [];

      // 1. Check availability and lock rows
      for (const i of items) {
        const res = await client.query(
          "SELECT quantity, price FROM inventory WHERE product_id=$1 FOR UPDATE",
          [i.productId]
        );

        if (res.rowCount === 0 || res.rows[0].quantity < i.qty) {
          await client.query('ROLLBACK');
          return { success: false };
        }
        
        reservedDetails.push({
          productId: i.productId,
          qty: i.qty,
          unitPrice: res.rows[0].price
        });
      }

      // 2. Deduct inventory
      for (const i of items) {
        await client.query(
          "UPDATE inventory SET quantity = quantity - $1, last_updated = NOW() WHERE product_id=$2",
          [i.qty, i.productId]
        );
      }

      await client.query('COMMIT');
      return { success: true, verifiedItems: reservedDetails };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
