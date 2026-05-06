const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dzjmyqqdh', 
  api_key: '235859172875442', 
  api_secret: 'U6YQcavxzELsSS9jHTmjLacMO90' 
});

async function uploadBg() {
  try {
    const bgResult = await cloudinary.uploader.upload('../we-watch-client/public/background.png', {
      folder: 'wewatch/assets',
      public_id: 'background',
      format: 'webp',
      transformation: [
        { quality: 'auto:good' }
      ]
    });
    console.log('Background WebP URL:', bgResult.secure_url);
  } catch (error) {
    console.error('Error uploading background:', error.message);
  }
}

uploadBg();
