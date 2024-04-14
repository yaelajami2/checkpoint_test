const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();
const fs = require('fs');
const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
// Configure AWS credentials and S3 bucket name
const s3Client = new S3Client({
  credentials: {
    
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: 'eu-central-1' // Add the region where your S3 bucket is located
});
const bucketName = 'e3yael';

// Function to count words in a text file
async function countWords(filePath) {
  const data = fs.readFileSync(filePath, 'utf-8');
  const words = data.split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  return wordCount;
}

// Function to upload word count results to S3
async function uploadToS3(fileName, data) {
  console.log(`Uploading word count results for ${fileName} to S3...`);
  const objectParams = {
    Bucket: bucketName,
    Key: `${fileName}-word-count.json`,
    Body: JSON.stringify(data), // Convert data to JSON format
  };
  const uploadCommand = new PutObjectCommand(objectParams);
  return s3Client.send(uploadCommand);
}

// Function to retrieve word count results from S3
// async function getFromS3(fileName) {
//   console.log(`Retrieving word count results for ${fileName} from S3...`);
//   const objectParams = {
//     Bucket: bucketName,
//     Key: `${fileName}-word-count.json`,
//   };
//   const getCommand = new GetObjectCommand(objectParams);
//   const { Body } = await s3Client.send(getCommand);
//   return JSON.parse(Buffer.from(await Readable.from(Body).collect()).toString());
// }
async function getFromS3(fileName) {
    console.log(`Retrieving word count results for ${fileName} from S3...`);
    const objectParams = {
      Bucket: bucketName,
      Key: `${fileName}-word-count.json`,
    };
    const getCommand = new GetObjectCommand(objectParams);
    const { Body } = await s3Client.send(getCommand);
  
    return new Promise((resolve, reject) => {
      let data = '';
      Body.on('data', chunk => {
        data += chunk.toString();
      });
      Body.on('end', () => {
        resolve(JSON.parse(data));
      });
      Body.on('error', reject);
    });
  }
  

// Example usage
const filePath = './InputText8.txt';

// Count words in the file
countWords(filePath)
  .then(wordCount => {
    console.log('Word count:', wordCount);
    // Upload results to S3
    return uploadToS3(filePath, wordCount);
  })
  .then(() => {
    console.log('Word count results uploaded to S3.');
    // Retrieve results from S3
    return getFromS3(filePath);
  })
  .then(wordCountFromS3 => {
    console.log('Word count results from S3:', wordCountFromS3);
  })
  .catch(err => {
    console.error('Error:', err);
  });
