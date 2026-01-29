const express = require("express");
const routes = require("./order.routes");

const app = express();
app.use(express.json());
routes(app);

app.listen(5000, () =>
  console.log("Order Service running on port 5000")
);
