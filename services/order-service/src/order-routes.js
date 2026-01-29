const axios = require("axios");
const { v4: uuid } = require("uuid");
const repo = require("./order-model");
// const publish = require("./kafka-producer");

module.exports = (app) => {
  // Health Check
  app.get("/health", async (req, res) => {
    const dbOk = await repo.ping();
    if (!dbOk) return res.status(503).json({ status: "DOWN", db: "disconnected" });
    res.json({ status: "UP", db: "connected" });
  });

  app.post("/", async (req, res) => {
    if (!req.body.items || !Array.isArray(req.body.items)) return res.status(400).send("Invalid items");

    const order = {
      id: uuid(),
      customerId: req.body.customerId || "guest",
      items: [], 
      totalAmount: 0,
      status: "PENDING"
    };

    try {
      // Timeout is 1.5s to fail fast before Gremlin (2s+) hits
      const inventoryRes = await axios.post(
        "http://inventory-service:6001/reserve",
        { items: req.body.items },
        { timeout: 1500 }
      );

      const reservedItems = inventoryRes.data.items;
      order.items = reservedItems;
      
      order.totalAmount = reservedItems.reduce((sum, item) => {
        return sum + (Number(item.qty) * Number(item.unitPrice));
      }, 0);

      // 2. If success, persist as CONFIRMED
      order.status = "CONFIRMED";
      await repo.createOrder(order);
      // await publish("order.created", order);

      res.status(201).json(order);

    } catch (e) {
      console.error(`[Order] Failed: ${e.message}`);
      
      order.status = "FAILED";
      if (order.items.length === 0) {
        order.items = req.body.items.map(i => ({...i, unitPrice: 0}));
      }
      
      try {
        await repo.createOrder(order);
      } catch (dbError) {
        console.error("Failed to persist failed order", dbError);
      }

      // await publish("order.failed", order);
      
      if (e.code === 'ECONNABORTED') {
        return res.status(504).json({ error: "Inventory Service Timeout. Order processing delayed." });
      }
      if (e.response && e.response.status === 409) {
          return res.status(409).json({ error: "Some items are out of stock." });
      }
      res.status(503).json({ error: "Service Temporarily Unavailable" });
    }
  });
};
