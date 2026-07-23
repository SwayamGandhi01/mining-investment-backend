const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;

console.log('Testing Cloudinary config from .env:', { cloudName, apiKey });

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const testImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

async function testUpload() {
  try {
    const res = await cloudinary.uploader.upload(testImage, { folder: 'test' });
    console.log('SUCCESS! Uploaded to Cloudinary:', res.secure_url);
  } catch (err) {
    console.error('ERROR uploading to Cloudinary:', err);
  }
}

testUpload();
