const request = require("supertest");
const express = require("express");
const axios = require("axios");
const orderRoutes = require("../src/order-routes");
const repo = require("../src/order-model");

// Mock dependencies
jest.mock("axios");
jest.mock("../src/order-model");

// Setup Express App for Testing
const app = express();
app.use(express.json());

// Mock Prometheus Counter Middleware if used in routes
app.locals = {
  errorCounter: { inc: jest.fn() } // Mock the counter we added
};

// Apply Routes
orderRoutes(app);

describe("Order Service API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Success Scenario
  it("should create an order successfully when inventory reserves items", async () => {
    // Mock Inventory Response
    axios.post.mockResolvedValue({
      data: {
        items: [
          { productId: 1, qty: 1, unitPrice: 50.00 }
        ]
      }
    });

    // Mock DB Success
    repo.createOrder.mockResolvedValue(true);

    const res = await request(app)
      .post("/")
      .send({
        customerId: "test-user",
        items: [{ productId: 1, qty: 1 }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("CONFIRMED");
    expect(res.body.totalAmount).toBe(50);
    expect(repo.createOrder).toHaveBeenCalledTimes(1);
  });

  // 2. Out of Stock Scenario
  it("should return 409 when items are out of stock", async () => {
    // Mock Inventory throwing 409
    const err = new Error("Conflict");
    err.response = { status: 409 };
    axios.post.mockRejectedValue(err);

    // Mock DB (Order failed persistence)
    repo.createOrder.mockResolvedValue(true);

    const res = await request(app)
      .post("/")
      .send({
        customerId: "test-user",
        items: [{ productId: 1, qty: 100 }]
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/out of stock/i);
    expect(app.locals.errorCounter.inc).toHaveBeenCalledWith({ type: 'BusinessLogic', message: 'OutOfStock' });
  });

  // 3. Timeout Failure (The Gremlin Test)
  it("should return 504 when inventory service times out", async () => {
    // Mock Axios Timeout Error
    const err = new Error("Timeout of 1500ms exceeded");
    err.code = 'ECONNABORTED';
    axios.post.mockRejectedValueOnce(err).mockRejectedValueOnce(err);
    axios.get.mockRejectedValue({ response: { status: 404, data: { status: "NOT_FOUND" } } });

    repo.createOrder.mockResolvedValue(true);

    const res = await request(app)
      .post("/")
      .send({
        customerId: "test-user",
        items: [{ productId: 1, qty: 1 }]
      });

    expect(res.statusCode).toBe(504);
    expect(res.body.error).toMatch(/timeout/i);
    expect(app.locals.errorCounter.inc).toHaveBeenCalledWith({ type: 'DependencyError', message: 'InventoryTimeout' });
    
    // Ensure we tried to save the FAILED order for audit logs
    expect(repo.createOrder).toHaveBeenCalled();
  });

  // 4. Invalid Input
  it("should return 400 for invalid input", async () => {
    const res = await request(app)
      .post("/")
      .send({ customerId: "bad-request" }); // missing items

    expect(res.statusCode).toBe(400);
  });
});
