const { v4: uuid } = require("uuid");
const repo = require("./inventory-model");
const gremlin = require("./middleware/gremlin");

let ghostCounter = 0;
const GHOST_ENABLED = process.env.GHOST_ENABLED === "true";
const GHOST_INTERVAL = Number(process.env.GHOST_INTERVAL || 5);
const GHOST_MODE = process.env.GHOST_MODE || "500";

module.exports = (app) => {
  // Health Check Endpoint
  app.get("/health", async (req, res) => {
    const dbOk = await repo.ping();
    if (!dbOk) return res.status(503).json({ status: "DOWN", db: "disconnected" });
    res.json({ status: "UP", db: "connected" });
  });

  app.post("/reserve", gremlin, async (req, res) => {
    try {
      const reservationId = req.body.reservationId || uuid();
      const result = await repo.reserve(req.body.items, reservationId);
      ghostCounter += 1;

      if (result.pending) {
        return res.status(202).json({ message: "Reservation pending", reservationId });
      }
      if (!result.success) {
        req.app.locals.errorCounter.inc({ type: 'BusinessLogic', message: 'OutOfStock' });
        return res.status(409).json({ message: "Out of stock", reservationId });
      }

      if (GHOST_ENABLED && ghostCounter % GHOST_INTERVAL === 0) {
        console.warn(`[GHOST] Simulated failure after commit for ${reservationId}`);
        if (GHOST_MODE === "crash") {
          process.exit(1);
        }
        return res.status(500).json({ message: "Ghost failure after commit", reservationId });
      }
      
      res.json({
        message: "Reserved",
        reservationId,
        items: result.verifiedItems
      });
    } catch (err) {
      console.error(err);
      req.app.locals.errorCounter.inc({ type: 'DatabaseError', message: err.message });
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/reserve/status", async (req, res) => {
    const { reservationId } = req.query;
    if (!reservationId) return res.status(400).json({ error: "reservationId required" });

    try {
      const status = await repo.getReservationStatus(reservationId);
      if (!status) return res.status(404).json({ status: "NOT_FOUND" });

      if (status.status === "PENDING") {
        return res.status(202).json({ status: "PENDING" });
      }
      if (status.status === "FAILED") {
        return res.status(409).json({ status: "FAILED" });
      }

      return res.json({ status: "RESERVED", items: status.items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "ERROR" });
    }
  });

  app.post("/add", async (req, res) => {
    const items = req.body.items;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items" });
    }

    try {
      const updated = await repo.addStock(items);
      res.json({ message: "Inventory updated", items: updated });
    } catch (err) {
      console.error(err);
      req.app.locals.errorCounter.inc({ type: 'DatabaseError', message: err.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
