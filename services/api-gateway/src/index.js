const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const AUTH_SERVICE = "http://auth-service:4000";
const ORDER_SERVICE = "http://order-service:5000";

// Simple JWT middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token");

  try {
    jwt.verify(token, "secret");
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// Auth routes (no auth required)
app.use("/auth", createProxyMiddleware({
  target: AUTH_SERVICE,
  changeOrigin: true
}));

// Order routes (auth required)
app.use("/orders", authenticate, createProxyMiddleware({
  target: ORDER_SERVICE,
  changeOrigin: true
}));

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});
