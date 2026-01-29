# Valerix API Documentation

## Base URL
All services are accessed through the API Gateway at `http://api-gateway:3000`

---

## Order Service
Base Path: `/orders`

### Create Order
**POST** `/orders`

Creates a new order and reserves inventory.

**Request Body:**
```json
{
  "customerId": "string (optional, defaults to 'guest')",
  "items": [
    {
      "productId": "string",
      "qty": "number"
    }
  ]
}
```

**Response (201 - Success):**
```json
{
  "id": "uuid",
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "qty": "number",
      "unitPrice": "number"
    }
  ],
  "totalAmount": "number",
  "status": "CONFIRMED"
}
```

**Error Responses:**
- `400` - Invalid items format
- `409` - Items out of stock
- `504` - Inventory service timeout
- `503` - Service unavailable

### Health Check
**GET** `/orders/health`

**Response (200):**
```json
{
  "status": "UP",
  "db": "connected"
}
```

---

## Inventory Service
Base Path: `/inventory`

### Reserve Inventory
**POST** `/inventory/reserve`

Reserves inventory for order items.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "string",
      "qty": "number"
    }
  ]
}
```

**Response (200 - Success):**
```json
{
  "message": "Reserved",
  "items": [
    {
      "productId": "string",
      "qty": "number",
      "unitPrice": "number"
    }
  ]
}
```

**Error Responses:**
- `409` - Out of stock
- `500` - Internal server error
- `503` - Database disconnected

### Health Check
**GET** `/inventory/health`

**Response (200):**
```json
{
  "status": "UP",
  "db": "connected"
}
```

---

## API Gateway

### Gateway Health
**GET** `/`

Returns a simple health message.

**Response (200):**
```
Hey, I am in the API gateway Cluster
```

### Metrics
**GET** `/metrics`

Returns Prometheus metrics for monitoring.

**Response (200):**
Content-Type: text/plain
