// const AWS = require("aws-sdk");
// const { exec } = require("child_process");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");
// const iconv = require("iconv-lite");
// require("dotenv").config();
// const connectDB = require("../config/db");
// const { MongoClient } = require("mongodb");

// connectDB();

// const convert = async (req, res) => {
//   try {
//     // Create an S3 instance
//     const s3 = new AWS.S3();
//     let htmlContent;

//     // Function to download a DOCX file from S3
//     const downloadDocxFromS3 = async (filePath) => {
//       try {
//         // Download the file from S3
//         // const{fullname,username,dob,email,password}=req.body
//         const { bucketName, key } = req.body;
//         const params = {
//           Bucket: bucketName,
//           Key: key,
//         };
//         const { Body } = await s3.getObject(params).promise();

//         // Save the file to the specified path
//         fs.writeFileSync(filePath, Body);

//         console.log(`File downloaded successfully,`, filePath);
//       } catch (error) {
//         console.error("Error downloading file:", error);
//       }
//     };

//     function convertDocxToHtml(filePath, htmlFilePath) {
//       return new Promise((resolve, reject) => {
//         const outputFilename = "aws.html";
//         const outputPath = path.join(htmlFilePath, outputFilename);
//         const command = `pandoc -s "${filePath}" -t html -o "${outputPath}" --metadata title="My Document Title"`;

//         exec(command, (error, stdout, stderr) => {
//           if (error) {
//             reject(error);
//             return;
//           }
//           if (stderr) {
//             reject(new Error(stderr));
//             return;
//           }
//           resolve(outputPath);
//           try {
//             htmlContent = fs.readFileSync(outputPath, "utf-8");
//             console.log(htmlContent,"htmlContent ")
//             resolve(htmlContent);
//           } catch (err) {
//             reject(err);
//           }
//         });
//       });
//     }

//     const dbName = "mastertable";
//     const collectionName = "htmlfiles";

//     //save to html
//     const saveHTMLToMongoDB = () => {
//       const data = fs.readFileSync(filePath, "utf-8");
    
//       MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true })
//         .then((client) => {
//           const db = client.db(dbName);
//           const collection = db.collection(collectionName);
    
//           collection
//             .insertOne({ html: data })
//             .then((result) => {
//               console.log("HTML file saved to MongoDB successfully.");
//               client.close();
//             })
//             .catch((err) => {
//               console.error("Error saving to MongoDB:", err);
//               client.close();
//             });
//         })
//         .catch((err) => {
//           console.error("Error connecting to MongoDB:", err);
//         });
//     };

//     //callings...
//     // const bucketName = "docxtohtml";
//     // const key = "Templet.docx";

//     // await s3.getObject({params}).promise();

//     // const homeDirectory = os.getcwd();
//     const filePath = `${__dirname}${process.env.DOCX}`;
//     const htmlOutputPath = `${__dirname}${process.env.HTML}`;

//     await downloadDocxFromS3(filePath);
//     convertDocxToHtml(filePath, htmlOutputPath)
//       .then((outputPath) => {
//         console.log(`Conversion from DOCX to HTML successful!`);
//         console.log("HTML output file path:", outputPath);
//       })
//       .catch((error) => {
//         console.error("DOCX to HTML conversion error:", error);
//       });

//     saveHTMLToMongoDB(htmlOutputPath);
//     return res.json({
//       message:
//         "Docx is Downloaded from S3 bucket and Docx is converted to html...",
//         html: htmlContent
//     });
//   } catch (err) {
//     res.json({
//       message: err.message,
//     });
//   }
// };
// module.exports = convert;
