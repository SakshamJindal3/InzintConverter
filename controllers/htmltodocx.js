const mongoo = require("mongoose");
const { exec } = require("child_process");
const AWS = require("aws-sdk");
const fs = require("fs");
require("../router/router");

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESSKEY,
    secretAccessKey: process.env.SECRETACCESSKEY,
  },
});

const uploadFileToS3 = (filePath, bucketName, fileKey) => {
  const s3 = new AWS.S3();
  // Read the file from the local filesystem
  const fileContent = fs.readFileSync(filePath);
  // Set up the parameters for the S3 upload
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileContent,
  };

  // Upload the file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading file:", err);
    } else {
      console.log("File uploaded successfully:", data.Location);
    }
  });
};

const convertHtmlToDocx = (htmlFilePath, docxFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `pandoc -s "${htmlFilePath}" -t docx -o "${docxFilePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }
      resolve(docxFilePath);
    });
  });
};

const htmltodocx = async (req, res) => {
  const { bucketName, fileKey } = req.body;
  const htmlFilePath = `${__dirname}${process.env.HTML}/aws.html`;
  const docxOutputPath = `${__dirname}${process.env.DOCX}`;
  try {
    const resp = await convertHtmlToDocx(htmlFilePath, docxOutputPath);
    if (resp) {
      await uploadFileToS3(docxOutputPath, bucketName, fileKey);
      return res.status(200).json({
        message: "Html is converted to docx and uploaded to s3 bucket...",
        resp,
      });
    } else {
      return res.status(400).json({
        error: "HTML to DOCX conversion error:",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = htmltodocx;
