const logEl = document.getElementById("log");
const metricsEl = document.getElementById("metrics");

const orderHealthEl = document.getElementById("orderHealth");
const inventoryHealthEl = document.getElementById("inventoryHealth");

const baseUrlInput = document.getElementById("baseUrl");

const customerIdInput = document.getElementById("customerId");
const orderProductIdInput = document.getElementById("orderProductId");
const orderQtyInput = document.getElementById("orderQty");
const reserveProductIdInput = document.getElementById("reserveProductId");
const reserveQtyInput = document.getElementById("reserveQty");

const log = (msg) => {
  const time = new Date().toLocaleTimeString();
  logEl.innerHTML = `[${time}] ${msg}<br/>` + logEl.innerHTML;
};

const getBase = () => baseUrlInput.value.replace(/\/+$/, "");

const setPill = (el, ok, text) => {
  el.textContent = text;
  el.style.background = ok ? "#16a34a" : "#ef4444";
};

document.getElementById("checkHealth").addEventListener("click", async () => {
  const base = getBase();

  try {
    const orderRes = await fetch(`${base}/orders/health`);
    const orderJson = await orderRes.json();
    setPill(orderHealthEl, orderRes.ok, orderJson.status);
    log(`Order /health -> ${orderRes.status}`);
  } catch (e) {
    setPill(orderHealthEl, false, "DOWN");
    log(`Order /health failed: ${e.message}`);
  }

  try {
    const invRes = await fetch(`${base}/inventory/health`);
    const invJson = await invRes.json();
    setPill(inventoryHealthEl, invRes.ok, invJson.status);
    log(`Inventory /health -> ${invRes.status}`);
  } catch (e) {
    setPill(inventoryHealthEl, false, "DOWN");
    log(`Inventory /health failed: ${e.message}`);
  }
});

document.getElementById("fetchMetrics").addEventListener("click", async () => {
  const base = getBase();
  try {
    const res = await fetch(`${base}/metrics`);
    const text = await res.text();
    metricsEl.textContent = text;
    log(`Gateway /metrics -> ${res.status}`);
  } catch (e) {
    metricsEl.textContent = "Failed to fetch metrics.";
    log(`Metrics failed: ${e.message}`);
  }
});

document.getElementById("placeOrder").addEventListener("click", async () => {
  const base = getBase();
  const pid = parseInt(orderProductIdInput.value);
  const qty = parseInt(orderQtyInput.value);

  if (!pid || !qty) return log("Please enter valid Product ID and Quantity");

  const payload = {
    customerId: customerIdInput.value || "guest",
    items: [{ productId: pid, qty: qty }]
  };

  try {
    const res = await fetch(`${base}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      log(`POST /orders -> ${res.status} | ${JSON.stringify(data)}`);
    } catch {
      log(`POST /orders -> ${res.status} | ${text}`);
    }
  } catch (e) {
    log(`POST /orders failed: ${e.message}`);
  }
});

document.getElementById("gremlinTest").addEventListener("click", async () => {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 150));
    document.getElementById("placeOrder").click();
  }
});

document.getElementById("reserveItems").addEventListener("click", async () => {
  const base = getBase();
  const pid = parseInt(reserveProductIdInput.value);
  const qty = parseInt(reserveQtyInput.value);

  if (!pid || !qty) return log("Please enter valid Product ID and Quantity");

  const payload = {
    items: [{ productId: pid, qty: qty }]
  };

  try {
    const res = await fetch(`${base}/inventory/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      log(`POST /inventory/reserve -> ${res.status} | ${JSON.stringify(data)}`);
    } catch {
      log(`POST /inventory/reserve -> ${res.status} | ${text}`);
    }
  } catch (e) {
    log(`Reserve failed: ${e.message}`);
  }
});
