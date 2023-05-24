const express = require("express");
const  docxtohtml  = require("../controllers/docxapi");
const router = express.Router();
router.get("/download",docxtohtml);
module.exports = router;