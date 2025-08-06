const CaptchaAnalyzer = require('../src/index');
const path = require('path');

async function example() {
    const analyzer = new CaptchaAnalyzer();
    
    try {
        await analyzer.init();
        console.log('Captcha analyzer initialized');
        
        // Example usage - replace with your image path
        const imagePath = path.join(__dirname, 'sample_captcha.png');
        console.log(`Analyzing image: ${imagePath}`);
        
        const result = await analyzer.processImage(imagePath);
        
        console.log('Analysis Results:');
        console.log('- Original:', result.originalPath);
        console.log('- Preprocessed:', result.preprocessedPath);
        console.log('- Recognized Text:', result.recognizedText);
        
    } catch (error) {
        console.error('Analysis failed:', error.message);
    } finally {
        await analyzer.terminate();
    }
}

// Run example if called directly
if (require.main === module) {
    example();
}