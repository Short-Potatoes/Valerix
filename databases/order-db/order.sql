CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id TEXT,
  status TEXT NOT NULL, -- 'PENDING', 'CONFIRMED', 'SHIPPED', 'CANCELLED'
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id INTEGER NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2)
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
