const axios = require("axios");
const { v4: uuid } = require("uuid");
const repo = require("./order-model");
// const publish = require("./kafka-producer");

const reserveInventory = (items, reservationId) =>
  axios.post(
    "http://inventory-service:6001/reserve",
    { items, reservationId },
    { timeout: 1500 }
  );

const getReservationStatus = async (reservationId) => {
  try {
    const res = await axios.get("http://inventory-service:6001/reserve/status", {
      params: { reservationId },
      timeout: 1500
    });
    return { status: res.data.status || "RESERVED", items: res.data.items || [] };
  } catch (err) {
    if (err.response) {
      return { status: err.response.data?.status || "UNKNOWN", items: [] };
    }
    return { status: "UNKNOWN", items: [] };
  }
};

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

    const reservationId = uuid();

    try {
      // Timeout is 1.5s to fail fast before Gremlin (2s+) hits
      let inventoryRes = await reserveInventory(req.body.items, reservationId);

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

      const isTimeout = e.code === 'ECONNABORTED';
      const isServerError = e.response && e.response.status >= 500;

      if (isTimeout || isServerError) {
        try {
          const retryRes = await reserveInventory(req.body.items, reservationId);
          const retryItems = retryRes.data.items;
          order.items = retryItems;
          order.totalAmount = retryItems.reduce((sum, item) => {
            return sum + (Number(item.qty) * Number(item.unitPrice));
          }, 0);
          order.status = "CONFIRMED";
          await repo.createOrder(order);
          return res.status(201).json(order);
        } catch {
          const status = await getReservationStatus(reservationId);
          if (status.status === "RESERVED") {
            order.items = status.items;
            order.totalAmount = status.items.reduce((sum, item) => {
              return sum + (Number(item.qty) * Number(item.unitPrice));
            }, 0);
            order.status = "CONFIRMED";
            await repo.createOrder(order);
            return res.status(201).json(order);
          }
          if (status.status === "FAILED") {
            req.app.locals.errorCounter.inc({ type: 'BusinessLogic', message: 'OutOfStock' });
            return res.status(409).json({ error: "Some items are out of stock." });
          }
        }
      }
      
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
        req.app.locals.errorCounter.inc({ type: 'DependencyError', message: 'InventoryTimeout' });
        return res.status(504).json({ error: "Inventory Service Timeout. Order processing delayed.", reservationId });
      }
      if (e.response && e.response.status === 409) {
          req.app.locals.errorCounter.inc({ type: 'BusinessLogic', message: 'OutOfStock' });
          return res.status(409).json({ error: "Some items are out of stock.", reservationId });
      }

      req.app.locals.errorCounter.inc({ type: 'UnknownError', message: e.message });
      res.status(503).json({ error: "Service Temporarily Unavailable", reservationId });
    }
  });
};
