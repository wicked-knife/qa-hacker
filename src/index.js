const Jimp = require('jimp');
const { createWorker } = require('tesseract.js');

class CaptchaAnalyzer {
    constructor() {
        this.worker = null;
    }

    async init() {
        this.worker = await createWorker('eng');
        await this.worker.setParameters({
            tessedit_pageseg_mode: '8'
        });
    }

    async processImage(imagePath) {
        try {
            // Try multiple approaches
            const results = [];
            
            // Method 1: Direct OCR on original image
            const { data: { text: directResult } } = await this.worker.recognize(imagePath);
            results.push({ method: 'direct', text: directResult.trim() });
            
            // Method 2: Simple preprocessing with different PSM
            const image = await Jimp.Jimp.read(imagePath);
            image
                .resize({ w: image.bitmap.width * 4, h: image.bitmap.height * 4 })
                .invert()  // Invert colors (white text on black background)
                .greyscale();
            
            const preprocessedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
            await image.write(preprocessedPath);
            
            // Try different page segmentation modes for inverted image
            await this.worker.setParameters({ tessedit_pageseg_mode: '7' }); // Single text line
            const { data: { text: processedResult1 } } = await this.worker.recognize(preprocessedPath);
            results.push({ method: 'inverted-psm7', text: processedResult1.trim() });
            
            await this.worker.setParameters({ tessedit_pageseg_mode: '13' }); // Raw line
            const { data: { text: processedResult2 } } = await this.worker.recognize(preprocessedPath);
            results.push({ method: 'inverted-psm13', text: processedResult2.trim() });
            
            // Reset to original PSM
            await this.worker.setParameters({ tessedit_pageseg_mode: '8' });
            
            // Method 3: High contrast version
            const image2 = await Jimp.Jimp.read(imagePath);
            image2
                .resize({ w: image2.bitmap.width * 2, h: image2.bitmap.height * 2 })
                .greyscale()
                .contrast(0.7)
                .normalize();
            
            const contrastPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_contrast.png');
            await image2.write(contrastPath);
            
            const { data: { text: contrastResult } } = await this.worker.recognize(contrastPath);
            results.push({ method: 'contrast', text: contrastResult.trim() });
            
            return {
                originalPath: imagePath,
                preprocessedPath: preprocessedPath,
                allResults: results,
                bestResult: this.chooseBestResult(results)
            };
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }
    
    chooseBestResult(results) {
        // Post-process each result to fix common OCR errors
        const processedResults = results.map(result => ({
            ...result,
            text: this.postProcessText(result.text),
            originalText: result.text
        }));
        
        // Choose result with numbers and operators
        const validPattern = /[0-9+=?]/;
        for (const result of processedResults) {
            if (validPattern.test(result.text) && result.text.length > 0) {
                return result;
            }
        }
        return processedResults[0]; // fallback to first result
    }
    
    postProcessText(text) {
        console.log('Original OCR text:', text);
        
        // Common OCR corrections for math captchas
        let corrected = text
            .replace(/aa/gi, '4')     // "aa" often misread as "4"
            .replace(/[oO0]/g, '0')   // O -> 0
            .replace(/[lI1|]/g, '1')  // l,I,| -> 1
            .replace(/[T]/gi, '+')    // T -> +
            .replace(/s/g, '7')       // s -> 7 (not 5)
            .replace(/S/gi, '7')      // S -> 7 (not 5 for this case)
            .replace(/Z/gi, '2')      // Z -> 2
            .replace(/[^0-9+=?\s]/g, ''); // Remove other chars
        
        // Add missing equals sign if pattern suggests math equation
        if (/^[0-9]\+[0-9]\?$/.test(corrected)) {
            corrected = corrected.replace('?', '=?');
        }
        
        console.log('Corrected text:', corrected);
        return corrected.trim();
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
        }
    }
}

module.exports = CaptchaAnalyzer;