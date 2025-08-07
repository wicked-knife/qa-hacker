const Jimp = require('jimp');

class ImageProcessor {
    constructor() {}

    async processImage(imagePath) {
        try {
            // 仅生成反色放大处理的图片
            const image = await Jimp.Jimp.read(imagePath);
            image
                .resize({ w: image.bitmap.width * 4, h: image.bitmap.height * 4 })
                .invert()  // Invert colors (white text on black background)
                .greyscale();
            
            const invertedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_inverted.png');
            await image.write(invertedPath);
            
            return {
                originalPath: imagePath,
                invertedPath: invertedPath
            };
            
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }
}

module.exports = ImageProcessor;