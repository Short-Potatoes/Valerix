const repo = require("./inventory-model");
const gremlin = require("./middleware/gremlin");

module.exports = (app) => {
  // Health Check Endpoint
  app.get("/health", async (req, res) => {
    const dbOk = await repo.ping();
    if (!dbOk) return res.status(503).json({ status: "DOWN", db: "disconnected" });
    res.json({ status: "UP", db: "connected" });
  });

  app.post("/reserve", gremlin, async (req, res) => {
    try {
      const result = await repo.reserve(req.body.items);
      if (!result.success) {
        req.app.locals.errorCounter.inc({ type: 'BusinessLogic', message: 'OutOfStock' });
        return res.status(409).send("Out of stock");
      }
      
      res.json({
        message: "Reserved",
        items: result.verifiedItems
      });
    } catch (err) {
      console.error(err);
      req.app.locals.errorCounter.inc({ type: 'DatabaseError', message: err.message });
      res.status(500).send("Internal Server Error");
    }
  });
};
