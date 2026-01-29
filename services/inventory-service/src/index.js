const express = require("express");
const inventoryRoutes = require("./inventory-routes");
const client = require('prom-client');

const app = express();
app.use(express.json());

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

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
