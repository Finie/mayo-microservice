const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

require("./server/server");
const orders = require("./routes/orders");
const authentication = require("./routes/auth");
const payment = require("./routes/payments");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

app.use("/api/orders", orders);
app.use("/api/auth", authentication);
app.use("/api/payment", payment);

if (app.get("env") === "development") {
  app.use(morgan("dev"));
  console.log("====================================");
  console.log("Developmet env: Morgan is running...");
  console.log("====================================");
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
