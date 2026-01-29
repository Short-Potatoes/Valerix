const express = require("express");
const orderRoutes = require("./order.routes");

const app = express();
app.use(express.json());

orderRoutes(app);

app.listen(5000, () => {
  console.log("Order Service running on port 5000");
});
