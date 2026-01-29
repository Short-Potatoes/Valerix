const repo = require("./inventory-model");

module.exports = (app) => {
  // Health Check Endpoint
  app.get("/health", async (req, res) => {
    const dbOk = await repo.ping();
    if (!dbOk) return res.status(503).json({ status: "DOWN", db: "disconnected" });
    res.json({ status: "UP", db: "connected" });
  });

  app.post("/reserve", async (req, res) => {
    // GREMLIN LATENCY SIMULATION
    // 25% chance of severe latency (2s - 5s)
    if (Math.random() < 0.25) {
      const delay = Math.floor(Math.random() * 3000) + 2000;
      console.log(`[Inventory] GREMLIN ATTACK! Delaying response by ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await repo.reserve(req.body.items);
      if (!result.success) return res.status(409).send("Out of stock");
      
      res.json({
        message: "Reserved",
        items: result.verifiedItems
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });
};
