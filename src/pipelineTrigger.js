const fs = require('fs');
const path = require('path');
const https = require('https');

class PipelineTrigger {
    constructor() {
        this.apiUrl = 'https://qa-pro.cdfinance.com.cn/qaapi/qa/flow/entrance/createTestApply';
    }

    loadRequestData(requestDataPath) {
        if (!requestDataPath) {
            throw new Error('Request data path is required');
        }
        
        try {
            const data = fs.readFileSync(requestDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load request data from ${requestDataPath}: ${error.message}`);
        }
    }

    async triggerPipeline(accessToken, requestDataPath) {
        if (!accessToken) {
            throw new Error('ACCESS_TOKEN is required');
        }

        const requestData = this.loadRequestData(requestDataPath);
        const postData = JSON.stringify(requestData);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(this.apiUrl, options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.success && response.code === 200) {
                            console.log('Pipeline triggered successfully:', response.data);
                            resolve(response);
                        } else {
                            console.error('Pipeline trigger failed:', response);
                            reject(new Error(`API Error: ${response.msg || 'Unknown error'}`));
                        }
                    } catch (error) {
                        console.error('Failed to parse response:', body);
                        reject(new Error(`Invalid JSON response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request error:', error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }
}

module.exports = PipelineTrigger;