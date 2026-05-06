const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const https = require('https');

cloudinary.config({ 
  cloud_name: 'dzjmyqqdh', 
  api_key: '235859172875442', 
  api_secret: 'U6YQcavxzELsSS9jHTmjLacMO90' 
});

const AVATARS = [
  'https://i.pinimg.com/736x/dd/cc/1e/ddcc1e5c98cf8b45e507a222ab63537c.jpg',
  'https://i.pinimg.com/736x/2b/f0/b0/2bf0b0feecc5c890ea47f90c7c7c775d.jpg',
  'https://i.pinimg.com/1200x/2a/d4/51/2ad451fd301c0efa4164f8f8cf5528d4.jpg',
  'https://i.pinimg.com/1200x/b3/a9/e9/b3a9e93c366f9fdfec0f39567533814c.jpg',
  'https://i.pinimg.com/736x/95/44/3f/95443f626f10db8be67483bb85f64946.jpg',
  'https://i.pinimg.com/736x/58/66/f3/5866f3697f115723ae5106ab6179c26e.jpg',
  'https://i.pinimg.com/736x/57/6c/a1/576ca16ccb0c131e2558bc863eba14cd.jpg',
  'https://i.pinimg.com/736x/23/86/0d/23860d1322543caa8539bad1e8f73763.jpg',
  'https://i.pinimg.com/1200x/20/ca/cb/20cacbd63df6c4a6c8aec0a34b29276f.jpg',
];

async function uploadImages() {
  console.log('Uploading background image...');
  try {
    const bgResult = await cloudinary.uploader.upload('public/background.png', {
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

  console.log('\nUploading avatars...');
  const newAvatarUrls = [];
  for (let i = 0; i < AVATARS.length; i++) {
    try {
      const res = await cloudinary.uploader.upload(AVATARS[i], {
        folder: 'wewatch/avatars',
        public_id: `avatar_${i + 1}`,
        format: 'webp',
        transformation: [
          { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' }
        ]
      });
      newAvatarUrls.push(res.secure_url);
      console.log(`Avatar ${i + 1}: ${res.secure_url}`);
    } catch (err) {
      console.error(`Error uploading avatar ${i + 1}:`, err.message);
      newAvatarUrls.push(AVATARS[i]); // fallback
    }
  }

  console.log('\nNew AVATARS array:');
  console.log(JSON.stringify(newAvatarUrls, null, 2));
}

uploadImages();
