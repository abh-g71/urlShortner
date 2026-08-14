const express = require("express");
const helmet = require("helmet");
const urlRoutes = require("./routes/urlRoutes");

const app = express();

app.use(helmet());
app.use(express.json());

app.use("/api", urlRoutes);

module.exports = app;
