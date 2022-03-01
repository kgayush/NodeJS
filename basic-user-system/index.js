const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/v1/user");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static("uploads"));

app.listen(PORT, () => {
  console.log('Server running on PORT: ',PORT);
});

app.use("/user", userRoutes);