const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const client = require('prom-client');

const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use("/orders", createProxyMiddleware({
  target: "http://order-service:5000",
  timeout: 2000,
  proxyTimeout: 2000,
  changeOrigin: true,
  pathRewrite: {
    "^/orders": "",
  }
}));

app.use("/inventory", createProxyMiddleware({
  target: "http://inventory-service:6001",
  changeOrigin: true,
  pathRewrite: {
    "^/inventory": "",
  },
}));

app.get('/', (req, res)=>{
  res.send('Hey, I am in the API gateway Cluster');
});

app.listen(3000, () =>
  console.log("API Gateway running on port 3000")
);
