const express = require("express");
const inventoryRoutes = require("./inventory.routes");

const app = express();
app.use(express.json());

inventoryRoutes(app);

app.listen(6000, () => {
  console.log("Inventory Service running on port 6000");
});
