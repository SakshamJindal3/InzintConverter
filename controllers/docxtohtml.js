
const DOCxHTML = require('../models/mastertable');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESSKEY,
      secretAccessKey: process.env.SECRETACCESSKEY,
    },
  });

const downloadDocxFromS3 = async (filePath, bucketName, key) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
  
      const response = await s3.send(command);
  
      const fileStream = fs.createWriteStream(filePath);
      response.Body.pipe(fileStream);
  
      return new Promise((resolve, reject) => {
        fileStream.on('finish', () => {
          console.log("File downloaded successfully:", filePath);
          resolve(filePath);
        });
  
        fileStream.on('error', (error) => {
          console.error("Error downloading file:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  };

  
  const convertDocxToHtml = async (filePath, htmlFilePath) => {
    return new Promise((resolve, reject) => {
      const outputFilename = "aws.html";
      const outputPath = path.join(htmlFilePath, outputFilename);
      const command = `pandoc -s "${filePath}" -t html -o "${outputPath}" --metadata title="My Document Title"`;
  
      const childProcess = exec(command, async (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(new Error(stderr));
          return;
        }
        try {
          const htmlContent = fs.readFileSync(outputPath, "utf-8");
          const jsonString = JSON.stringify(htmlContent, null, 2);
          resolve({
            // "content-Saved": newSchema,
            "htmlContent": jsonString,
          });
        } catch (err) {
          reject(err);
        }
      });
  
      childProcess.on("error", (error) => {
        reject(error);
      });
    }).catch((error) => {
      console.error("Error converting DOCX to HTML:", error);
      throw error;
    });
  };
  
  
  const docxToHtml = async (req, res) => {
    try {
        const { bucketName, key } = req.body;
        const filePath = `${__dirname}${process.env.DOCX}`;
        const htmlOutputPath = `${__dirname}${process.env.HTML}`;
        
        const downloadedFilePath = await downloadDocxFromS3(filePath, bucketName, key);
        const convertedData = await convertDocxToHtml(downloadedFilePath, htmlOutputPath);
        
        console.log("Conversion from DOCX to HTML successful!");

        return res.status(200).json({
          message: "Docx is downloaded from S3 bucket and converted to HTML.",
          html: convertedData["htmlContent"],
        });
        
    } catch (err) {
        res.status(500).json({
        message: err.message,
      });
    }
  };

  module.exports = docxToHtml ;