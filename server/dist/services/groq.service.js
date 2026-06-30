"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqService = exports.GroqService = void 0;
const axios_1 = __importDefault(require("axios"));
const readline_1 = __importDefault(require("readline"));
const environment_1 = __importDefault(require("../config/environment"));
const logger_1 = __importDefault(require("../config/logger"));
class GroqService {
    apiKey;
    baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    constructor() {
        this.apiKey = environment_1.default.GROQ_API_KEY || '';
    }
    async chatCompletion(systemPrompt, userPrompt, responseFormat) {
        try {
            const response = await axios_1.default.post(this.baseUrl, {
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                response_format: responseFormat ? { type: responseFormat } : undefined,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            logger_1.default.error(`Groq API Completion Error: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }
    async visionCompletion(systemPrompt, prompt, fileBuffer, mimeType) {
        try {
            const base64 = fileBuffer.toString('base64');
            const response = await axios_1.default.post(this.baseUrl, {
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`,
                                },
                            },
                        ],
                    },
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' },
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            logger_1.default.error(`Groq Vision API Error: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }
    async chatCompletionStream(systemPrompt, history, onChunk, onComplete) {
        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
            ];
            const response = await axios_1.default.post(this.baseUrl, {
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                stream: true,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                responseType: 'stream',
            });
            let fullResponseText = '';
            const rl = readline_1.default.createInterface({
                input: response.data,
                terminal: false,
            });
            rl.on('line', (line) => {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr === '[DONE]') {
                        onComplete(fullResponseText);
                        return;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        const delta = parsed.choices[0]?.delta?.content;
                        if (delta) {
                            onChunk(delta);
                            fullResponseText += delta;
                        }
                    }
                    catch (_) { }
                }
            });
        }
        catch (error) {
            logger_1.default.error(`Groq Streaming Error: ${error.message}`);
            throw error;
        }
    }
}
exports.GroqService = GroqService;
exports.groqService = new GroqService();
exports.default = exports.groqService;
