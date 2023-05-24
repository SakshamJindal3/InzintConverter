// const mastertable = require("../models/mastertable");
const mongoo=require("mongoose");
const { exec } = require('child_process');
const AWS = require('aws-sdk');
const fs
 = require('fs');
const os = require('os');
// const path = require('path');
// require("dotenv").config();
require("../router/htmltodocx");
// const { Module } = require("module");
            // Set your AWS credentials and region


const finalconversion = async (req, res) => {
    try
    {
      AWS.config.update({
      accessKeyId: process.env.ACCESSKEY,
      secretAccessKey: process.env.SECRETACCESSKEY,
      region: process.env.REGION,
    });

        const s3 = new AWS.S3();

        // Function to upload a file to S3
        function uploadFileToS3(bucketName, fileKey, filePath) {
        // Read the file from the local filesystem
        const fileContent = fs.readFileSync(filePath);

        // Set up the parameters for the S3 upload
        const params = {
            Bucket: bucketName,
            Key: fileKey,
            Body: fileContent
        };

        // Upload the file to S3
        s3.upload(params, (err, data) => {
            if (err) {
            console.error('Error uploading file:', err);
            } else {
            console.log('File uploaded successfully:', data.Location);
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

        //calling...
        const homeDirectory = os.homedir();
        const htmlFilePath = `${homeDirectory}${process.env.HTML}\\aws.html`;
        const docxOutputPath = `${homeDirectory}${process.env.DOCX}`;
    
        try {
          const resp = await convertHtmlToDocx(htmlFilePath, docxOutputPath);
          console.log('DOCX output file path:', resp);
        } catch (error) {
          console.error('HTML to DOCX conversion error:', error);
        }
          
        // Example usage
        const bucketName = 'docxtohtml';
        const fileKey = `aws.docx`; // The key (filename) for the file in the bucket
        const filePath = `${homeDirectory}${process.env.DOCX}`; // The local path of the file

        await uploadFileToS3(bucketName, fileKey, filePath);

        return res.json({
          message:"Html is converted to docx and uploaded to s3 bucket...",
          });;
          
    }
    catch(err){
        res.json({
        message:err.message
        });
    };
}


module.exports = finalconversion;