
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

  
  const convertDocxToHtml = async (filePath, htmlFilePath, originalName) => {
    return new Promise(async (resolve, reject) => {
      const outputFilename = "aws.html";
      const outputPath = path.join(htmlFilePath, outputFilename);
      const command = `pandoc -s "${filePath}" -t html -o "${outputPath}" --metadata title="." --extract-media=${htmlFilePath}`;
      //new callings
      processImagesInFolder(`${htmlFilePath}/media`);
      const input1="FlatService ";//input 1
      const input2="Final Report";//input 2
      replaceInputValue(outputPath, input1, input2);
      //
      try {
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
            const htmlData = fs.readFileSync(outputPath, "utf-8");
            resolve({
              htmlContent: htmlData,
            });
          } catch (err) {
            reject(err);
          }
        });
  
        childProcess.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        console.error("Error converting DOCX to HTML:", error);
        reject(error);
      }
    });
  };
  
  function countFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Number of files in the folder: ${files.length}`);
      return files.length;
    });
  }

  function processImagesInFolder(folderPath) {
    const files = fs.readdirSync(folderPath);

    files.sort((a, b) => {
      const numA = extractNumberFromFilename(a);
      const numB = extractNumberFromFilename(b);
      return numA - numB;
    });
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${folderPath}/${file}`;
  
      // Perform actions with the image file here
      console.log(`Processing image: ${filePath}`);
      // Example: Upload the image, modify it, or perform any other operations
    }
  }
  
  function extractNumberFromFilename(filename) {
    const numRegex = /(\d+)/g;
    const matches = filename.match(numRegex);
    if (matches) {
      return parseInt(matches[0]);
    }
    return 0;
  }


  function replaceInputValue(filePath, input1, input2) {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    const updatedContent = fileContent.replace(new RegExp(`\\b${input1}\\b`, 'g'), input2);
    const tempFilePath = `${filePath}.temp`;
    fs.writeFileSync(tempFilePath, updatedContent, 'utf8');
    fs.renameSync(tempFilePath, filePath);
    console.log(`Replacement complete: ${input1} replaced with ${input2}`);
  } catch (err) {
     console.error(err);
    }
  }
  
  const docxToHtml = async (req, res) => {
    try {
        const { bucketName, key, originalName } = req.body;
        const filePath = `${__dirname}${process.env.DOCX}`;
        const htmlOutputPath = `${__dirname}${process.env.HTML}`;
        
        const downloadedFilePath = await downloadDocxFromS3(filePath, bucketName, key);
        const convertedData = await convertDocxToHtml(downloadedFilePath, htmlOutputPath, originalName);
        
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