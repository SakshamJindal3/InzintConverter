const AWS = require("aws-sdk");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const iconv = require("iconv-lite");
require("dotenv").config();
const connectDB = require("../config/db");
const { MongoClient } = require("mongodb");

connectDB();

const convert = async (req, res) => {
  try {
    // Set your AWS credentials and region
    AWS.config.update({
      accessKeyId: process.env.ACCESSKEY,
      secretAccessKey: process.env.SECRETACCESSKEY,
      region: process.env.REGION,
    });

    // Create an S3 instance
    const s3 = new AWS.S3();

    // Function to download a DOCX file from S3
    const downloadDocxFromS3 = async (bucketName, key, filePath) => {
      const params = {
        Bucket: bucketName,
        Key: key,
      };

      try {
        // Download the file from S3
        const { Body } = await s3.getObject(params).promise();

        // Save the file to the specified path
        fs.writeFileSync(filePath, Body);

        console.log(`File downloaded successfully,`, filePath);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    };

    function convertDocxToHtml(filePath, htmlFilePath) {
      return new Promise((resolve, reject) => {
        const outputFilename = "aws.html";
        const outputPath = path.join(htmlFilePath, outputFilename);
        const command = `pandoc -s "${filePath}" -t html -o "${outputPath}" --metadata title="My Document Title"`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          if (stderr) {
            reject(new Error(stderr));
            return;
          }
          resolve(outputPath);
        });
      });
    }

    const dbName = "mastertable";
    const collectionName = "htmlfiles";

    //save to html
    const saveHTMLToMongoDB = () => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }

        const utf8Data = iconv.decode(data, "utf-8");

        MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true })
          .then((client) => {
            const db = client.db(dbName);
            const collection = db.collection(collectionName);

            collection
              .insertOne({ html: utf8Data })
              .then((result) => {
                console.log("HTML file saved to MongoDB successfully.");
                client.close();
              })
              .catch((err) => {
                console.error("Error saving to MongoDB:", err);
                client.close();
              });
          })
          .catch((err) => {
            console.error("Error connecting to MongoDB:", err);
          });
      });
    };

    //callings...
    const bucketName = "docxtohtml";
    const key = "Templet.docx";

    const homeDirectory = os.homedir();
    const filePath = `${homeDirectory}${process.env.DOCX}`;
    const htmlOutputPath = `${homeDirectory}${process.env.HTML}`;

    await downloadDocxFromS3(bucketName, key, filePath);
    convertDocxToHtml(filePath, htmlOutputPath)
      .then((outputPath) => {
        console.log(`Conversion from DOCX to HTML successful!`);
        console.log("HTML output file path:", outputPath);
      })
      .catch((error) => {
        console.error("DOCX to HTML conversion error:", error);
      });

    saveHTMLToMongoDB(htmlOutputPath);
    return res.json({
      message:
        "Docx is Downloaded from S3 bucket and Docx is converted to html...",
    });
  } catch (err) {
    res.json({
      message: err.message,
    });
  }
};
module.exports = convert;
