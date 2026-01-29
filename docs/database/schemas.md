Overview
This warehouse system is composed of two primary microservices:
- Orders Service: Handles order creation, persistence, and status management.
- Inventory Service: Manages item reservations and stock validation.
- API Gateway: Routes client requests to the appropriate service.
All services expose RESTful APIs with JSON payloads.

---

## Order Database (orders)
Tables:
- **orders**
	- `id` (UUID) – main order ID
	- `customer_id` – who placed the order
	- `status` – PENDING/CONFIRMED/FAILED/SHIPPED/etc.
	- `total_amount` – order total
	- `created_at`, `updated_at`
- **order_items**
	- `order_id` – links to orders.id
	- `product_id`, `quantity`, `unit_price`

Why it exists:
- Orders are saved even if Inventory fails (for audit/debugging).

## Inventory Database (inventory)
Tables:
- **inventory**
	- `product_id` – primary key
	- `product_name`, `price`
	- `quantity` – current stock
	- `last_updated`
- **reservations**
	- `reservation_id` – idempotency key
	- `items` – JSON list of reserved items
	- `status` – PENDING / RESERVED / FAILED
	- `created_at`

Why `reservations` exists:
- If Inventory commits but crashes before replying, Order retries safely.
- Duplicate calls with the same `reservation_id` will not double-decrease stock.

## Seed data
The inventory database loads demo products so you can test right away:
- Mouse, Keyboard, Headset, 4K Monitor, Gaming Console
