const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

class LoginModule {
    constructor() {
        // 不在构造函数中读取环境变量，而是在使用时读取
    }

    async login(captchaCode, uuid) {
        // 重新加载环境变量以获取最新值
        require('dotenv').config();
        
        // 首先检查现有token是否有效
        const existingToken = await this.checkExistingToken();
        if (existingToken) {
            console.log('✅ 使用现有有效token，跳过登录');
            return existingToken;
        }
        
        const username = process.env.QA_USERNAME;
        const password = process.env.QA_PASSWORD;
        
        if (!username || !password) {
            throw new Error('QA_USERNAME and QA_PASSWORD must be set in environment variables');
        }

        if (!uuid) {
            throw new Error('UUID is required for login');
        }

        const loginData = {
            username,
            password,
            code: captchaCode,
            uuid: uuid
        };

        try {
            console.log('🔐 发送登录请求...');
            console.log('📋 登录请求参数:', JSON.stringify(loginData, null, 2));
            const response = await this.makeLoginRequest(loginData);
            console.log('📥 登录响应:', JSON.stringify(response, null, 2));
            
            if (response.code === 200 && response.success) {
                const { accessToken, expireMills } = response.data;
                const expiryTime = Date.now() + parseInt(expireMills);
                
                await this.saveTokenToEnv(accessToken, expiryTime);
                
                console.log('✅ 登录成功！');
                return {
                    accessToken,
                    expiryTime,
                    success: true
                };
            } else {
                throw new Error(`登录失败: ${response.msg || '未知错误'}`);
            }
        } catch (error) {
            console.error('❌ 登录失败:', error.message);
            throw error;
        }
    }

    async checkExistingToken() {
        try {
            const accessToken = process.env.ACCESS_TOKEN;
            const tokenExpiryTime = process.env.TOKEN_EXPIRY_TIME;
            
            if (!accessToken || !tokenExpiryTime) {
                console.log('📋 未找到现有token或过期时间');
                return null;
            }
            
            const expiryTimestamp = parseInt(tokenExpiryTime);
            const currentTime = Date.now();
            
            if (isNaN(expiryTimestamp)) {
                console.log('⚠️ TOKEN_EXPIRY_TIME格式无效');
                return null;
            }
            
            if (currentTime >= expiryTimestamp) {
                console.log('⏰ 现有token已过期');
                return null;
            }
            
            const remainingTime = Math.floor((expiryTimestamp - currentTime) / 1000 / 60);
            console.log(`🔑 现有token有效，剩余时间: ${remainingTime} 分钟`);
            
            return {
                accessToken,
                expiryTime: expiryTimestamp,
                success: true,
                isExisting: true
            };
            
        } catch (error) {
            console.error('❌ 检查现有token失败:', error.message);
            return null;
        }
    }

    makeLoginRequest(loginData) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(loginData);
            
            const options = {
                hostname: 'qa-pro.cdfinance.com.cn',
                port: 443,
                path: '/qaapi/oauth/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Failed to parse response JSON'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    async saveTokenToEnv(accessToken, expiryTime) {
        try {
            const envPath = path.join(__dirname, '..', '.env');
            let envContent = '';
            
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
            
            const lines = envContent.split('\n');
            
            const tokenLine = `ACCESS_TOKEN=${accessToken}`;
            const expiryLine = `TOKEN_EXPIRY_TIME=${expiryTime}`;
            
            const tokenIndex = lines.findIndex(line => line.startsWith('ACCESS_TOKEN='));
            const expiryIndex = lines.findIndex(line => line.startsWith('TOKEN_EXPIRY_TIME='));
            
            if (tokenIndex !== -1) {
                lines[tokenIndex] = tokenLine;
            } else {
                lines.push(tokenLine);
            }
            
            if (expiryIndex !== -1) {
                lines[expiryIndex] = expiryLine;
            } else {
                lines.push(expiryLine);
            }
            
            fs.writeFileSync(envPath, lines.filter(line => line.trim()).join('\n') + '\n');
            console.log('✅ Token已保存到.env文件');
            
        } catch (error) {
            console.error('❌ 保存Token到.env文件失败:', error.message);
            throw error;
        }
    }
}

module.exports = LoginModule;