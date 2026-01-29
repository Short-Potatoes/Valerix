## Valerix Microservices (Simple Guide)

This project is split into small services so one failure does not break the whole system.

### Services
- **API Gateway**: The front door. The UI talks to it, and it forwards requests to other services.
- **Order Service**: Creates orders and calls Inventory to reserve stock.
- **Inventory Service**: Checks stock, reserves items, and updates quantity.
- **Postgres (order-db, inventory-db)**: Stores orders and inventory data.

### How a normal order works
1. UI sends `POST /orders` to API Gateway.
2. API Gateway forwards to Order Service.
3. Order Service calls Inventory Service `POST /reserve`.
4. Inventory reserves stock in DB and responds.
5. Order Service saves the order in DB and returns success.

### Why you may see errors
- **409 Conflict**: Out of stock.
- **504 Gateway Timeout**: Inventory is slow (Gremlin latency test).
- **500**: Simulated “ghost” failure (commit happened, response failed).

### Reliability features (simple)
- **Gremlin latency**: Every Nth request is delayed to simulate slow network.
- **Reservation idempotency**: Retries are safe (no double stock deduction).
- **Reservation status check**: If Inventory crashes after commit, Order checks status and continues.

### Key HTTP endpoints (via Gateway)
- `GET /orders/health`
- `POST /orders`
- `GET /inventory/health`
- `POST /inventory/reserve`
- `GET /inventory/reserve/status?reservationId=...`
- `POST /inventory/add` (increase stock)
- `GET /metrics`

### Folder map
- **services/**: Source code for each service
- **client/**: Frontend UI
- **databases/**: SQL schema and seed data
- **k8s/**: Kubernetes manifests (optional)
