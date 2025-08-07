require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');

class GeminiClient {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        
        // 配置代理
        const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:9097');
        this.ai = new GoogleGenAI({ 
            apiKey: this.apiKey,
            fetchOptions: {
                agent: proxyAgent
            }
        });
    }

    async sendTextMessage(text) {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: text,
            });
            return response.text;
        } catch (error) {
            throw new Error(`Gemini API request failed: ${error.message}`);
        }
    }

    async sendMultimodalMessage(text, imagePaths = []) {
        try {
            const contents = [{ text }];
            
            for (const imagePath of imagePaths) {
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found: ${imagePath}`);
                }
                
                const imageData = fs.readFileSync(imagePath);
                const mimeType = this.getMimeType(imagePath);
                
                contents.push({
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType
                    }
                });
            }

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: contents,
            });
            return response.text;
        } catch (error) {
            throw new Error(`Gemini multimodal API request failed: ${error.message}`);
        }
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    async testConnection() {
        try {
            const response = await this.sendTextMessage('Hello, this is a test message. Please reply with "Connection successful!"');
            console.log('Gemini API Test Response:', response);
            return response;
        } catch (error) {
            console.error('Gemini API Test Failed:', error.message);
            throw error;
        }
    }
}

module.exports = GeminiClient;