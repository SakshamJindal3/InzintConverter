const express = require("express");
const htmltodocx = require("../controllers/htmlapi");
const  docxtohtml  = require("../controllers/docxapi");
const router = express.Router();
router.get("/upload", htmltodocx);
router.post("/download",docxtohtml);
module.exports = router;
