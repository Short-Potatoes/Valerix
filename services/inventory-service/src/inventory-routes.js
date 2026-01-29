const Inventory = require("./inventory.model");

module.exports = (app) => {

  app.post("/reserve", (req, res) => {
    const success = Inventory.reserve(req.body.items);
    if (!success) {
      return res.status(409).send("Insufficient stock");
    }
    res.send("Reserved");
  });

  app.get("/", (req, res) => {
    res.json(Inventory.getAll());
  });
};
