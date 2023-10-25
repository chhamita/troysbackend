const fs = require('fs');

function imageToBase64(imagePath) {
  try {
    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Convert the buffer to a base64 string
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    return base64Image;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

module.exports = { imageToBase64 };
