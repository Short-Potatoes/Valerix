const { v4: uuid } = require("uuid");
const axios = require("axios");
const Order = require("./order.model");

module.exports = (app) => {

  app.post("/", async (req, res) => {
    const order = {
      id: uuid(),
      items: req.body.items,
      status: "CREATED"
    };

    // Reserve inventory
    try {
      await axios.post("http://inventory-service:6000/reserve", {
        orderId: order.id,
        items: order.items
      });

      order.status = "RESERVED";
      Order.create(order);
      res.status(201).json(order);

    } catch (err) {
      res.status(409).json({ message: "Inventory unavailable" });
    }
  });

  app.get("/", (req, res) => {
    res.json(Order.getAll());
  });
};
