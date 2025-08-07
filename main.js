const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ImageDownloader = require('./src/imageDownloader');
const ImageProcessor = require('./src/imageProcess');
const ImageRecognition = require('./src/imageRecognition');
const LoginModule = require('./src/loginModule');
const PipelineTrigger = require('./src/pipelineTrigger');

class MainProcessor {
    constructor() {
        this.imageDownloader = new ImageDownloader();
        this.imageProcessor = new ImageProcessor();
        this.imageRecognition = new ImageRecognition();
        this.loginModule = new LoginModule();
        this.pipelineTrigger = new PipelineTrigger();
    }

    async writeUuidToEnv(uuid) {
        try {
            const envPath = path.join(__dirname, '.env');
            let envContent = '';
            
            // 读取现有的.env文件内容
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
            
            // 更新或添加UUID
            const uuidLine = `CAPTCHA_UUID=${uuid}`;
            const lines = envContent.split('\n');
            
            // 查找是否已存在CAPTCHA_UUID
            const uuidIndex = lines.findIndex(line => line.startsWith('CAPTCHA_UUID='));
            
            if (uuidIndex !== -1) {
                lines[uuidIndex] = uuidLine;
            } else {
                lines.push(uuidLine);
            }
            
            // 写回文件
            fs.writeFileSync(envPath, lines.filter(line => line.trim()).join('\n') + '\n');
            console.log(`✅ UUID已写入.env文件: ${uuid}`);
            
        } catch (error) {
            console.error('❌ 写入.env文件失败:', error.message);
            throw error;
        }
    }

    async processComplete() {
        try {
            console.log('🚀 开始图片处理流程...\n');
            
            // 步骤1: 下载图片
            console.log('📥 步骤1: 下载图片...');
            const downloadResult = await this.imageDownloader.downloadAndSave();
            const { uuid, imagePath } = downloadResult;
            
            // 步骤2: 将UUID写入.env文件
            console.log('\n📝 步骤2: 保存UUID到环境变量...');
            await this.writeUuidToEnv(uuid);
            
            // 步骤3: 图片预处理
            console.log('\n🔧 步骤3: 图片预处理...');
            const processResult = await this.imageProcessor.processImage(imagePath);
            
            console.log('\n📊 图片处理结果:');
            console.log(`原图路径: ${processResult.originalPath}`);
            console.log(`反色图路径: ${processResult.invertedPath}`);
            
            // 步骤4: 使用Gemini AI识别反色图片
            console.log('\n🤖 步骤4: 使用Gemini AI识别反色图片...');
            let geminiResult = null;
            try {
                geminiResult = await this.imageRecognition.recognizeMathExpression(processResult.invertedPath);
                console.log(`✅ Gemini识别结果: ${geminiResult}`);
            } catch (error) {
                console.log(`❌ Gemini识别失败: ${error.message}`);
            }
            
            // 步骤5: 登录系统
            let loginResult = null;
            if (geminiResult) {
                console.log('\n🔐 步骤5: 使用识别结果登录系统...');
                try {
                    loginResult = await this.loginModule.login(geminiResult, uuid);
                    console.log(`✅ 登录成功，Token已保存`);
                } catch (error) {
                    console.log(`❌ 登录失败: ${error.message}`);
                }
            }
            
            // 步骤6: 触发流水线
            let pipelineResult = null;
            if (loginResult) {
                console.log('\n🚀 步骤6: 触发流水线...');
                try {
                    const requestDataPath = path.join(__dirname, 'pipelineRequestData.json');
                    pipelineResult = await this.pipelineTrigger.triggerPipeline(process.env.ACCESS_TOKEN, requestDataPath);
                    console.log(`✅ 流水线触发成功: ${pipelineResult.data}`);
                } catch (error) {
                    console.log(`❌ 流水线触发失败: ${error.message}`);
                }
            }
            
            console.log('\n✅ 流程完成！');
            
            return {
                uuid: uuid,
                imagePath: imagePath,
                invertedPath: processResult.invertedPath,
                recognitionResult: geminiResult,
                loginResult: loginResult,
                pipelineResult: pipelineResult
            };
            
        } catch (error) {
            console.error('\n❌ 处理流程失败:', error.message);
            
            // 无需清理资源
            
            throw error;
        }
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const processor = new MainProcessor();
    processor.processComplete()
        .then(result => {
            console.log('\n🎉 最终结果:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 程序执行失败:', error);
            process.exit(1);
        });
}

module.exports = MainProcessor;