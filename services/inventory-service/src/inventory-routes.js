const repo = require("./inventory.repo");

module.exports = (app) => {
  app.post("/reserve", async (req, res) => {
    const ok = await repo.reserve(req.body.items);
    if (!ok) return res.status(409).send("Out of stock");
    res.send("Reserved");
  });
};
