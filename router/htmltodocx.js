const express = require("express");
const htmltodocx = require("../controllers/htmlapi");
const router = express.Router();
router.get("/upload", htmltodocx);
module.exports = router;
