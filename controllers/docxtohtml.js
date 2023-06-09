
const DOCxHTML = require('../models/mastertable');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
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


  const deleteFilesInFolder = () => {
    try {

      const folderPath = `${__dirname}/TempFiles/media`;
      const DocFilePath = `${__dirname}${process.env.DOCX}`;
      const htmlOutputPath = `${__dirname}${process.env.HTML}`;
      const outputFilename = "aws.html";
      const outputPath = path.join(htmlOutputPath, outputFilename);

      // Read the contents of the folder
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error('Error reading folder:', err);
          return;
        }
  
        // Iterate over the files and delete each one
        files.forEach((file) => {
          const filePath = path.join(folderPath, file);
          fs.unlink(filePath, (error) => {            
            if (error) {
              console.error('Error deleting file:', error);
            } else {
              console.log('Deleted file');
            }
          });
        });

        fs.unlink(DocFilePath, (error) => {
          if (error) {
            console.error('Error deleting file:', error);
          } else {
            console.log('Deleted file');
          }
        });

        fs.unlink(outputPath, (error) => {
          if (error) {
            console.error('Error deleting file:', error);
          } else {
            console.log('Deleted file');
          }
        });
      });
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };
  

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
  
  
  const saveImagesToS3= async(fileName, bucketName)=>{
    try {
      const folderPath = `${__dirname}/TempFiles/media`;
      const htmlFilePath = `${__dirname}/TempFiles/aws.html`;

     
      const files = fs.readdirSync(folderPath);
      const fileNameWithoutExtension = path.basename(fileName, '.docx');

      const uploadedFiles= [];
  
      for (const file of files) {
        const filePath = `${folderPath}/${file}`;
        const fileStream = fs.createReadStream(filePath);
  
        const uploadParams = {
          Bucket: `${bucketName}`,
          Key: `master-documents/${fileNameWithoutExtension}/${file}`,
          Body: fileStream,
        };
  
        const uploadCommand = new PutObjectCommand(uploadParams);
        const uploaded= await s3.send(uploadCommand);

        const searchText= `${file}"`

       

        await replaceTextInHTMLFile(htmlFilePath, searchText, `${file}" data-imageId="master-documents/${fileNameWithoutExtension}/${file}"`)
        uploadedFiles.push({ key: `master-documents/${fileNameWithoutExtension}/${file}`, bucket: bucketName });
      };
      return uploadedFiles ;      
    } catch (error) {
      console.error(error)
      console.log('Error with Images:',error)
      throw error;
      
    }
  }
  

  const replaceTextInHTMLFile = (filePath, searchText, replacementText) => {
  try {
    // Read the file content
    let data = fs.readFileSync(filePath, 'utf8');

    // Replace occurrences of the search text with the replacement text
    const updatedContent = data.replace(new RegExp(searchText, 'g'), replacementText);

    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    console.log('Text replaced successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
};
  
  const docxToHtml = async (req, res) => {
    try {
        const { bucketName, key, originalName } = req.body;
        const filePath = `${__dirname}${process.env.DOCX}`;
        const htmlOutputPath = `${__dirname}${process.env.HTML}`;
        
        const downloadedFilePath = await downloadDocxFromS3(filePath, bucketName, key);
        const convertedData = await convertDocxToHtml(downloadedFilePath, htmlOutputPath, originalName);
        const uploadedImages = await saveImagesToS3(key, bucketName);
        
        console.log("Conversion from DOCX to HTML successful!");

        const outputFilename = "aws.html";
        const outputPath = path.join(htmlOutputPath, outputFilename);

        const htmlData = fs.readFileSync(`${outputPath}`, "utf-8");

        // await deleteFilesInFolder();
        return res.status(200).json({
          message: "Docx is downloaded from S3 bucket and converted to HTML.",
          html: htmlData,
          media:uploadedImages
        });
        
    } catch (err) {
      console.error(err)
        res.status(500).json({
        message: err.message,
      });
    }
  };

  module.exports = docxToHtml ;