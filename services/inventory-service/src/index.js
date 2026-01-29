const express = require("express");
const inventoryRoutes = require("./inventory-routes");

const app = express();
app.use(express.json());

inventoryRoutes(app);

app.get('/', (req, res)=>{
  res.send('Hey, I am in the Inventory Service Cluster');
});

const startServer = async () => {
  let retries = 10;
  while (retries > 0) {
    try {
      app.listen(6001, () => {
        console.log("Inventory Service running on port 6001");
      });
      break;
    } catch (e) {
      retries--;
      console.log(`Failed to start server, retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

startServer();
