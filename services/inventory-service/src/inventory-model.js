const { Pool } = require("pg");

const pool = new Pool({
  host: "inventory-db",
  user: "postgres",
  password: "postgres",
  database: "inventory"
});

module.exports = {
  async reserve(items) {
    for (const i of items) {
      const res = await pool.query(
        "SELECT quantity FROM inventory WHERE product_id=$1",
        [i.productId]
      );

      if (res.rowCount === 0 || res.rows[0].quantity < i.qty) {
        return false;
      }
    }

    for (const i of items) {
      await pool.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2",
        [i.qty, i.productId]
      );
    }

    return true;
  }
};
