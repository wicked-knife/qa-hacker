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
        try {
            const rawResult = await this.recognizeImage(
                imagePath, 
                '请识别这张图片中的数学算式并计算。只返回最终的数字答案，不要包含等式、文字说明或其他内容。例如：如果算式是9+8，只返回：17'
            );
            
            console.log('原始Gemini返回结果:', rawResult);
            
            // 处理结果，提取纯数字答案
            const cleanResult = this.extractNumericAnswer(rawResult);
            console.log('处理后的结果:', cleanResult);
            
            return cleanResult;
            
        } catch (error) {
            console.error('❌ 数学表达式识别失败:', error.message);
            throw error;
        }
    }

    extractNumericAnswer(rawResult) {
        if (!rawResult || typeof rawResult !== 'string') {
            throw new Error('无效的识别结果');
        }

        // 去除首尾空白字符
        let result = rawResult.trim();
        
        // 情况1：检查是否已经是纯数字
        if (/^\d+$/.test(result)) {
            return result;
        }

        // 情况2：处理等式格式 "9 + 8 = 17" 或 "9+8=17"
        const equationMatch = result.match(/=\s*(\d+)/);
        if (equationMatch) {
            return equationMatch[1];
        }

        // 情况3：处理中文答案格式 "答案是17" "结果是17"
        const chineseAnswerMatch = result.match(/(?:答案|结果)(?:是|为|：|:)\s*(\d+)/);
        if (chineseAnswerMatch) {
            return chineseAnswerMatch[1];
        }

        // 情况4：处理冒号格式 "计算结果：17" "Result: 17"
        const colonMatch = result.match(/[:：]\s*(\d+)/);
        if (colonMatch) {
            return colonMatch[1];
        }

        // 情况5：提取字符串中的最后一个数字（通常是答案）
        const numbersMatch = result.match(/\d+/g);
        if (numbersMatch && numbersMatch.length > 0) {
            return numbersMatch[numbersMatch.length - 1];
        }

        // 情况6：特殊处理一些可能的格式
        // "The answer is 17" 等英文格式
        const englishAnswerMatch = result.match(/(?:answer|result)\s+(?:is\s+)?(\d+)/i);
        if (englishAnswerMatch) {
            return englishAnswerMatch[1];
        }

        // 如果都没有匹配到，抛出错误
        throw new Error(`无法从识别结果中提取数字答案: "${result}"`);
    }
}

module.exports = ImageRecognition;