const GeminiClient = require('./gemini');

class ImageRecognition {
    constructor() {
        this.gemini = new GeminiClient();
    }

    async recognizeImage(imagePath, prompt = '请识别这张图片中的数学算式，并直接返回计算结果。') {
        try {
            console.log('正在发送图片到Gemini进行识别...');
            
            const response = await this.gemini.sendMultimodalMessage(
                prompt,
                [imagePath]
            );
            
            console.log('✅ Gemini识别结果:', response);
            return response;
            
        } catch (error) {
            console.error('❌ 识别失败:', error.message);
            throw error;
        }
    }

    async recognizeMathExpression(imagePath) {
        return this.recognizeImage(
            imagePath, 
            '请识别这张图片中的数学算式，并直接返回计算结果。'
        );
    }
}

module.exports = ImageRecognition;