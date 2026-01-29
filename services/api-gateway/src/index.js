// const express = require("express");
// const { createProxyMiddleware } = require("http-proxy-middleware");
// const client = require('prom-client');

// const app = express();

// const collectDefaultMetrics = client.collectDefaultMetrics;
// collectDefaultMetrics({ register: client.register });

// app.get('/metrics', async (req, res) => {
//   res.set('Content-Type', client.register.contentType);
//   res.end(await client.register.metrics());
// });

// app.use("/orders", createProxyMiddleware({
//   target: "http://order-service:5000",
//   timeout: 2000,
//   proxyTimeout: 2000,
//   changeOrigin: true,
//   pathRewrite: {
//     "^/orders": "",
//   }
// }));

// app.use("/inventory", createProxyMiddleware({
//   target: "http://inventory-service:6001",
//   changeOrigin: true,
//   pathRewrite: {
//     "^/inventory": "",
//   },
// }));

// app.get('/', (req, res)=>{
//   res.send('Hey, I am in the API gateway Cluster');
// });

// app.listen(3000, () =>
//   console.log("API Gateway running on port 3000")
// );


const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const client = require('prom-client');

const app = express();

// Prometheus default metrics
// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Proxy to Orders service
app.use("/orders", createProxyMiddleware({
  target: "http://order-service:5000", // internal ClusterIP service
  changeOrigin: true,
  timeout: 5000,
  proxyTimeout: 5000,
  pathRewrite: { '^/orders': '/' }, // remove /orders prefix for backend
}));

// Proxy to Inventory service
app.use("/inventory", createProxyMiddleware({
  target: "http://inventory-service:6001", // internal ClusterIP service
  changeOrigin: true,
  timeout: 5000,
  proxyTimeout: 5000,
  pathRewrite: { '^/inventory': '/' }, // remove /inventory prefix for backend
}));

// Health endpoint
app.get('/', (req, res) => {
  res.send('API Gateway is running inside the cluster');
});

app.listen(3000, () =>
  console.log("API Gateway running on port 3000")
);
