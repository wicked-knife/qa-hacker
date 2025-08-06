const CaptchaAnalyzer = require('./src/index');

async function analyzeImage() {
    const analyzer = new CaptchaAnalyzer();
    
    try {
        console.log('Initializing captcha analyzer...');
        await analyzer.init();
        
        const imagePath = 'D:/projects/qa-hacker/4c1b4fa9df5501bec2ba5e38074c6fce.png';
        console.log(`Analyzing image: ${imagePath}`);
        
        const result = await analyzer.processImage(imagePath);
        
        console.log('\n=== Analysis Results ===');
        console.log('Original Image:', result.originalPath);
        console.log('Preprocessed Images:', result.preprocessedPath);
        console.log('\n--- All Results ---');
        result.allResults.forEach((res, index) => {
            console.log(`${index + 1}. ${res.method}: "${res.text}"`);
        });
        console.log('\n--- Best Result ---');
        console.log(`Method: ${result.bestResult.method}`);
        console.log(`Text: "${result.bestResult.text}"`);
        
    } catch (error) {
        console.error('Analysis failed:', error.message);
    } finally {
        await analyzer.terminate();
    }
}

analyzeImage();