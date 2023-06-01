const AWS = require("aws-sdk");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const connectDB = require("../config/db");
// const { JSDOM } = require('jsdom');
connectDB();

const convert = async (req, res) => {
  try {
    // Create an S3 instance
    const s3 = new AWS.S3();

    // Function to download a DOCX file from S3
    const downloadDocxFromS3 = async (filePath) => {
      try {
        const { bucketName, key } = req.body;
        const params = {
          Bucket: bucketName,
          Key: key,
        };
        const { Body } = await s3.getObject(params).promise();

        fs.writeFileSync(filePath, Body);

        console.log(`File downloaded successfully: ${filePath}`);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    };

    const convertDocxToHtml = (filePath, htmlFilePath) => {
      return new Promise((resolve, reject) => {
        // const outputFilename = "aws.html";
        // const outputPath = path.join(htmlFilePath, outputFilename);
        const command = `pandoc -s "${filePath}" -t html -o "${htmlFilePath}" --metadata title="My Document Title"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          if (stderr) {
            reject(new Error(stderr));
            return;
          }
          resolve(htmlFilePath);
        });
      });
    };

    const dbName = "mastertable";
    const collectionName = "htmlfiles";

    const saveHTMLToMongoDB = async () => {
      try {
        const htmlOutputPath = `${__dirname}${process.env.HTML}`;

        const data = await fs.promises.readFile(htmlOutputPath);
        // const data = fs.readFileSync(htmlOutputPath, 'utf-8');
        const utf8Data = data.toString("utf-8");
        // const utf8Data = JSON.parse(jsonString);
        console.log(utf8Data);
        // const utf8Data = JSON.parse(data.toString("utf-8"));

        const client = await MongoClient.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
        });

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        await collection.insertOne({ html: utf8Data });

        console.log("HTML file saved to MongoDB successfully.");

        client.close();

        return utf8Data;
      } catch (error) {
        console.error("Error saving to MongoDB:", error);
      }
    };

    const filePath = `${__dirname}${process.env.DOCX}`;
    const htmlOutputPath = `${__dirname}${process.env.HTML}`;

    await downloadDocxFromS3(filePath);
    const outputPath = await convertDocxToHtml(filePath, htmlOutputPath);

    console.log(`Conversion from DOCX to HTML successful!`);
    console.log("HTML output file path:", outputPath);

    const utf = await saveHTMLToMongoDB(htmlOutputPath);

    return res.json({
      data: utf,
    });
  } catch (err) {
    res.json({
      message: err.message,
    });
  }
};

module.exports = convert;
