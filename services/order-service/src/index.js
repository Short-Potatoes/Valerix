const express = require("express");
const routes = require("./order-routes");
const client = require('prom-client');

const app = express();
app.use(express.json());

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

routes(app);

app.get('/', (req, res)=>{
  res.send('Hey, I am in the Order Service Cluster');
});

const startServer = async () => {
  let retries = 10;
  while (retries > 0) {
    try {
      app.listen(5000, () =>
        console.log("Order Service running on port 5000")
      );
      break;
    } catch (e) {
      retries--;
      console.log(`Failed to start server, retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

startServer();
