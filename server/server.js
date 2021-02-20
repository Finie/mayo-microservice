const mongoose = require("mongoose");
require("dotenv/config");

mongoose
  .connect(process.env.MONGOCONNECTION, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error(err));

  
