let requestCounter = 0;

const GREMLIN_ENABLED = process.env.GREMLIN_ENABLED === "true";
const LAG_INTERVAL = Number(process.env.GREMLIN_LAG_INTERVAL || 4);
const LAG_DURATION = Number(process.env.GREMLIN_LAG_DURATION || 5000);

const gremlin = (req, res, next) => {
  if (!GREMLIN_ENABLED) return next();

  requestCounter += 1;

  if (requestCounter % LAG_INTERVAL === 0) {
    console.warn(`[GREMLIN] Latency injected on request #${requestCounter}`);
    setTimeout(() => next(), LAG_DURATION);
  } else {
    console.log(`[GREMLIN] Fast response #${requestCounter}`);
    next();
  }
};

module.exports = gremlin;
