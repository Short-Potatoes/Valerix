const axios = require("axios");
const { v4: uuid } = require("uuid");
const repo = require("./order.repo");
const publish = require("./kafka.producer");

module.exports = (app) => {

  app.post("/", async (req, res) => {
    const order = {
      id: uuid(),
      items: req.body.items,
      status: "CREATED"
    };

    try {
      await axios.post(
        "http://inventory-service:6000/reserve",
        { items: order.items },
        { timeout: 1500 }
      );

      order.status = "RESERVED";
      await repo.createOrder(order);
      await publish("order.reserved", order);

      res.status(201).json(order);

    } catch (e) {
      await publish("order.failed", order);
      res.status(503).send("Order failed");
    }
  });
};
