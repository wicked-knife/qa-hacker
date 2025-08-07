const https = require('https');
const fs = require('fs');
const path = require('path');

class ImageDownloader {
    constructor() {
        this.captchaDir = path.join(__dirname, '..', 'captcha');
        this.ensureCaptchaDir();
    }

    ensureCaptchaDir() {
        if (!fs.existsSync(this.captchaDir)) {
            fs.mkdirSync(this.captchaDir, { recursive: true });
        } else {
            // 清空目录下所有文件
            const files = fs.readdirSync(this.captchaDir);
            for (const file of files) {
                const filePath = path.join(this.captchaDir, file);
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
            console.log('✅ 已清空captcha目录下的文件');
        }
    }

    async getCaptcha() {
        return new Promise((resolve, reject) => {
            const url = 'https://qa-pro.cdfinance.com.cn/qaapi/oauth/auth/getCaptcha';
            
            https.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        
                        if (jsonData.success && jsonData.code === 200) {
                            const { uuid, img } = jsonData.data;
                            
                            // Convert base64 to PNG and save
                            const imagePath = this.saveBase64Image(img, uuid);
                            
                            resolve({
                                uuid: uuid,
                                imagePath: imagePath
                            });
                        } else {
                            reject(new Error(`API请求失败: ${jsonData.msg || '未知错误'}`));
                        }
                    } catch (error) {
                        reject(new Error(`解析响应失败: ${error.message}`));
                    }
                });

            }).on('error', (error) => {
                reject(new Error(`请求失败: ${error.message}`));
            });
        });
    }

    saveBase64Image(base64Data, uuid) {
        try {
            // Remove data:image/jpeg;base64, prefix if exists
            const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(base64Image, 'base64');
            
            // Create filename with UUID
            const filename = `${uuid}.png`;
            const imagePath = path.join(this.captchaDir, filename);
            
            // Save image to file
            fs.writeFileSync(imagePath, imageBuffer);
            
            console.log(`✅ 验证码图片已保存: ${imagePath}`);
            return imagePath;
            
        } catch (error) {
            throw new Error(`保存图片失败: ${error.message}`);
        }
    }

    async downloadAndSave() {
        try {
            console.log('正在获取验证码...');
            const result = await this.getCaptcha();
            console.log(`UUID: ${result.uuid}`);
            console.log(`图片路径: ${result.imagePath}`);
            return result;
        } catch (error) {
            console.error('❌ 获取验证码失败:', error.message);
            throw error;
        }
    }
}

module.exports = ImageDownloader;