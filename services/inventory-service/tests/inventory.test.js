const request = require("supertest");
const express = require("express");
const inventoryRoutes = require("../src/inventory-routes");
const repo = require("../src/inventory-model");

// Mock dependencies
jest.mock("../src/inventory-model");

// Setup Express App
const app = express();
app.use(express.json());

// Mock Prometheus Counter Middleware
app.locals = {
  errorCounter: { inc: jest.fn() }
};

inventoryRoutes(app);

describe("Inventory Service API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Success Scenario
  it("should reserve items successfully", async () => {
    repo.reserve.mockResolvedValue({
      success: true,
      verifiedItems: [{ productId: 1, qty: 1, unitPrice: 100 }]
    });

    const res = await request(app)
      .post("/reserve")
      .send({
        items: [{ productId: 1, qty: 1 }]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.message).toBe("Reserved");
  });

  // 2. Out of Stock Scenario
  it("should return 409 when reservation fails", async () => {
    repo.reserve.mockResolvedValue({ success: false });

    const res = await request(app)
      .post("/reserve")
      .send({
        items: [{ productId: 1, qty: 100 }]
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Out of stock");
    expect(app.locals.errorCounter.inc).toHaveBeenCalledWith({ type: 'BusinessLogic', message: 'OutOfStock' });
  });

  // 3. Database Error Scenario
  it("should return 500 when database throws error", async () => {
    repo.reserve.mockRejectedValue(new Error("DB Connection Failed"));

    const res = await request(app)
      .post("/reserve")
      .send({
        items: [{ productId: 1, qty: 1 }]
      });

    expect(res.statusCode).toBe(500);
    expect(res.text).toBe("Internal Server Error");
    expect(app.locals.errorCounter.inc).toHaveBeenCalledWith({ type: 'DatabaseError', message: 'DB Connection Failed' });
  });

  // 4. Health Check
  it("should return health status", async () => {
    repo.ping.mockResolvedValue(true);
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("UP");
  });

  // 5. Add Stock
  it("should add stock successfully", async () => {
    repo.addStock.mockResolvedValue([
      { product_id: 1, product_name: "Wireless Gaming Mouse", quantity: 60, price: "49.99" }
    ]);

    const res = await request(app)
      .post("/add")
      .send({
        items: [{ productId: 1, qty: 10 }]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Inventory updated");
    expect(res.body.items).toHaveLength(1);
  });
});
