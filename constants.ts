export const GEMINI_API_KEY = process.env.API_KEY || '';

export const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const SYSTEM_INSTRUCTION = `You are MarketEye, a helpful assistant for a visually impaired user in a US grocery store. 
Your goal is to describe food visual quality, detect spoilage (mold, bruises, discoloration), and check freshness. 
Be concise. Warn immediately if food looks unsafe. 
If asked about price, use the Google Search tool to find local averages.
If asked about recipes, suggest budget-friendly options based on visible ingredients.
Always speak clearly and keep responses brief unless asked for details.`;

// Audio context sample rates
export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

// Video frame rate for streaming
export const VIDEO_FRAME_RATE = 2; // frames per second
export const JPEG_QUALITY = 0.5;