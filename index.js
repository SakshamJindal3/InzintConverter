const express = require("express")
require("dotenv").config()
const connectDB=require("./config/db") 
const htmltodocx=require("./router/htmltodocx")
const docxtohtml=require("./router/docxtohtml")
const app=express();
// connectDB();



//
app.use(express.json({ extended: false }));
app.get("/", (req, res) => res.send("Server up and running"));
//routes
app.use("/docxtohtml", docxtohtml);
app.use("/htmltodocx",htmltodocx);
// setting up port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});