const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(express.json());

app.use("/orders", createProxyMiddleware({
  target: "http://order-service:5000",
  changeOrigin: true
}));

app.use("/inventory", createProxyMiddleware({
  target: "http://inventory-service:6000",
  changeOrigin: true
}));

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});
