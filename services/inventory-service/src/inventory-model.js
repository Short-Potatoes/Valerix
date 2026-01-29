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
  async getReservationStatus(reservationId) {
    const res = await pool.query(
      "SELECT status, items FROM reservations WHERE reservation_id=$1",
      [reservationId]
    );

    if (res.rowCount === 0) return null;

    return {
      status: res.rows[0].status,
      items: res.rows[0].items
    };
  },
  async reserve(items, reservationId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const reservedDetails = [];

      const insertRes = await client.query(
        "INSERT INTO reservations (reservation_id, items, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [reservationId, JSON.stringify([]), "PENDING"]
      );

      if (insertRes.rowCount === 0) {
        const existing = await client.query(
          "SELECT status, items FROM reservations WHERE reservation_id=$1",
          [reservationId]
        );

        await client.query('COMMIT');

        if (existing.rowCount === 0) return { success: false, pending: true };

        const status = existing.rows[0].status;
        if (status === "RESERVED") {
          return { success: true, verifiedItems: existing.rows[0].items, reused: true };
        }
        if (status === "FAILED") {
          return { success: false, reused: true };
        }

        return { success: false, pending: true };
      }

      // 1. Check availability and lock rows
      for (const i of items) {
        const res = await client.query(
          "SELECT quantity, price FROM inventory WHERE product_id=$1 FOR UPDATE",
          [i.productId]
        );

        if (res.rowCount === 0 || res.rows[0].quantity < i.qty) {
          await client.query(
            "UPDATE reservations SET status=$1 WHERE reservation_id=$2",
            ["FAILED", reservationId]
          );
          await client.query('COMMIT');
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

      await client.query(
        "UPDATE reservations SET status=$1, items=$2 WHERE reservation_id=$3",
        ["RESERVED", JSON.stringify(reservedDetails), reservationId]
      );

      await client.query('COMMIT');
      return { success: true, verifiedItems: reservedDetails };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
  async addStock(items) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = [];

      for (const i of items) {
        const res = await client.query(
          "INSERT INTO inventory (product_id, product_name, quantity, price) VALUES ($1, $2, $3, $4) ON CONFLICT (product_id) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, product_name = COALESCE(EXCLUDED.product_name, inventory.product_name), price = COALESCE(EXCLUDED.price, inventory.price), last_updated = NOW() RETURNING product_id, product_name, quantity, price",
          [i.productId, i.productName || null, i.qty, i.price || null]
        );
        updated.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return updated;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
