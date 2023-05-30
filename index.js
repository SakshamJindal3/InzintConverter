const express = require("express");
require("dotenv").config();
const AWS = require("aws-sdk");
const connectDB = require("./config/db");
const htmltodocx = require("./router/router");
const app = express();
// connectDB();

// Set your AWS credentials and region
AWS.config.update({
  accessKeyId: process.env.ACCESSKEY,
  secretAccessKey: process.env.SECRETACCESSKEY,
  region: process.env.REGION,
});
//
app.use(express.json({ extended: false }));
app.get("/", (req, res) => res.send("Server up and running"));
//routes
app.use("/file", htmltodocx);
// setting up port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
