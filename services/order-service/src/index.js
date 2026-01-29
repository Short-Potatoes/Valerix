const express = require("express");
const routes = require("./order-routes");

const app = express();
app.use(express.json());
routes(app);

app.get('/', (req, res)=>{
  res.send('Hey, I am in the Order Service Cluster');
});

const startServer = async () => {
  let retries = 10;
  while (retries > 0) {
    try {
      app.listen(5000, () =>
        console.log("Order Service running on port 5000")
      );
      break;
    } catch (e) {
      retries--;
      console.log(`Failed to start server, retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};

startServer();
