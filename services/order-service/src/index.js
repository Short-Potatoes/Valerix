const express = require("express");
const routes = require("./order-routes");
const client = require('prom-client');
const repo = require("./order-model"); 

const app = express();
app.use(express.json());

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5] 
});

const dbHealthGauge = new client.Gauge({
  name: 'db_health_status',
  help: 'Database connection status (1 = Connected, 0 = Disconnected)',
});

const errorCounter = new client.Counter({
  name: 'app_error_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'message'] 
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route: req.path, status_code: res.statusCode }, 
      duration / 1000
    );
  });
  next();
});

app.get('/metrics', async (req, res) => {
  const dbOk = await repo.ping();
  dbHealthGauge.set(dbOk ? 1 : 0);

  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.locals.errorCounter = errorCounter;

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
