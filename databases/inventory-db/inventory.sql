CREATE TABLE inventory (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT,
  quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(10, 2),
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_name ON inventory(product_name);
CREATE INDEX idx_quantity ON inventory(quantity);

-- Insert some initial dummy data for testing
INSERT INTO inventory (product_id, product_name, quantity, price) VALUES
(1, 'Wireless Gaming Mouse', 50, 49.99),
(2, 'Mechanical Keyboard', 30, 129.50),
(3, 'Gaming Headset', 45, 79.99),
(4, '4K Monitor', 10, 399.00),
(5, 'Gaming Console', 5, 499.00);
