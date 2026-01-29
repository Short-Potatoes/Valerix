# Valerix – Simple Project Guide

This is a beginner-friendly guide to understand the whole project.

## 1. What this project does
Valerix is a microservice-based e‑commerce backend with a small UI to test it.
You can:
- place orders
- reserve inventory
- simulate slow network (Gremlin)
- simulate “ghost” failures
- view health and metrics
- increase stock to reproduce conflicts

## 2. Main folders
- **client/** – Frontend UI (HTML/JS/CSS)
- **services/** – API Gateway, Order Service, Inventory Service
- **databases/** – SQL schema + seed data
- **k8s/** – Kubernetes manifests (optional)
- **docs/** – Documentation

## 3. How the services connect
- UI ➜ API Gateway ➜ Order Service ➜ Inventory Service ➜ Inventory DB
- Order Service also writes to Order DB

More detail: see [docs/architecture/microservices.md](architecture/microservices.md)

## 4. Frontend UI features
The UI has buttons to:
1. Check health and fetch metrics
2. Place order and run Gremlin test
3. Reserve items directly
4. Increase inventory stock

The log panel is large so you can see errors clearly.

## 5. Key endpoints (through gateway)
- `GET /orders/health`
- `POST /orders`
- `GET /inventory/health`
- `POST /inventory/reserve`
- `GET /inventory/reserve/status?reservationId=...`
- `POST /inventory/add`
- `GET /metrics`

## 6. Local run (Docker Compose)
Use `docker compose up -d --build` from the project root.

## 7. Deployment
The server at `139.59.86.35` is deployed via Docker Compose (not Kubernetes).
Deployment script is in [docs/.github/workflows/deploy.yml](../.github/workflows/deploy.yml).

## 8. Database schema
See [docs/database/schemas.md](database/schemas.md) for tables and why they exist.
