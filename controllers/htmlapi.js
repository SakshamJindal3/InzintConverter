const mongoo = require("mongoose");
const { exec } = require("child_process");
const AWS = require("aws-sdk");
const fs = require("fs");
require("../router/router");

const finalconversion = async (req, res) => {
  try {
    const s3 = new AWS.S3();

    // Function to upload a file to S3
    function uploadFileToS3(filePath) {
      // Read the file from the local filesystem
      const fileContent = fs.readFileSync(filePath);
      const { bucketName, fileKey } = req.body;
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
    }

    function convertHtmlToDocx(htmlFilePath, docxFilePath) {
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
    }

    const htmlFilePath = `${__dirname}${process.env.HTML}`;
    const docxOutputPath = `${__dirname}${process.env.DOCX}`;

    try {
      const resp = await convertHtmlToDocx(htmlFilePath, docxOutputPath);
      console.log("Docx Concerted and DOCX output file path:", resp);
    } catch (error) {
      console.error("HTML to DOCX conversion error:", error);
    }

    // Example usage

    const filePath = `${__dirname}${process.env.DOCX}`;
    await uploadFileToS3(filePath);

    fs.unlink(htmlFilePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return;
      }
      console.log("File deleted successfully.");
    });
    fs.unlink(docxOutputPath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return;
      }
      console.log("File deleted successfully.");
    });

    return res.json({
      data: "Html is converted to docx and uploaded to s3 bucket...",
    });
  } catch (err) {
    res.json({
      message: err.message,
    });
  }
};

module.exports = finalconversion;
