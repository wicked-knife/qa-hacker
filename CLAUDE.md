# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA Hacker is a CAPTCHA solving system that downloads verification code images from a specific API, processes them using image enhancement techniques, and recognizes mathematical expressions using Google's Gemini AI.

## Architecture

The system follows a modular pipeline architecture with four main components:

### Core Components

1. **ImageDownloader** (`src/imageDownloader.js`)
   - Downloads CAPTCHA images from `https://qa-pro.cdfinance.com.cn/qaapi/oauth/auth/getCaptcha`
   - Converts base64 responses to PNG files in `captcha/` directory
   - Returns UUID and local image path

2. **ImageProcessor** (`src/imageProcess.js`)
   - Processes images using Jimp library
   - Applies inverted color transformation (4x scale, invert, grayscale)
   - Optimizes images for AI recognition

3. **ImageRecognition** (`src/imageRecognition.js`)
   - Interfaces with Gemini AI through GeminiClient
   - Sends processed images for mathematical expression recognition
   - Returns calculated results

4. **GeminiClient** (`src/gemini.js`)
   - Handles Google Gemini AI API communication
   - Supports multimodal (text + image) requests
   - Configured with proxy support for network access

5. **MainProcessor** (`main.js`)
   - Orchestrates the complete workflow
   - Manages UUID persistence in .env file
   - Entry point for the application

### Data Flow

```
API Request → Base64 Image → PNG File → Inverted Processing → Gemini Recognition → Result
```

## Environment Setup

The application requires:

- `GEMINI_API_KEY`: Google Gemini AI API key (stored in .env)
- `CAPTCHA_UUID`: Latest captcha UUID (auto-managed by application)

## Running the Application

```bash
# Install dependencies
npm install

# Run the complete pipeline
node main.js
```

The application will:
1. Download a new CAPTCHA image
2. Save UUID to .env file
3. Process image with inverted color transformation
4. Send to Gemini AI for recognition
5. Output the mathematical result

## Key Dependencies

- `@google/genai`: Google Gemini AI client
- `jimp`: Image processing library
- `dotenv`: Environment variable management
- `https-proxy-agent`: Proxy support for API calls

## File Structure Notes

- `captcha/`: Directory for downloaded and processed images
- Images are saved with UUID filenames
- Processed images have `_inverted.png` suffix
- The system automatically cleans up and manages image files

## Network Configuration

The GeminiClient is configured to use a local proxy (`http://127.0.0.1:9097`) for API access. Modify `src/gemini.js` if different proxy settings are needed.

## Error Handling

All components include comprehensive error handling with descriptive console output. The main processor ensures graceful failure and resource cleanup.