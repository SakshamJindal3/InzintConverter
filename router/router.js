const express = require("express");
const htmltodocx = require("../controllers/htmltodocx");
// const  docxtohtml  = require("../controllers/docxapi");
const docxToHtml = require("../controllers/docxtohtml");
const router = express.Router();

router.get("/upload", htmltodocx);
router.post("/download", docxToHtml);
module.exports = router;
