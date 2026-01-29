CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID,
  product_id TEXT,
  quantity INT
);
