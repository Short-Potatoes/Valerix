const { Pool } = require("pg");

const pool = new Pool({
  host: "order-db",
  user: "postgres",
  password: "postgres",
  database: "orders"
});

module.exports = {
  async createOrder(order) {
    await pool.query(
      "INSERT INTO orders (id, status) VALUES ($1, $2)",
      [order.id, order.status]
    );

    for (const i of order.items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1,$2,$3)",
        [order.id, i.productId, i.qty]
      );
    }
  }
};
