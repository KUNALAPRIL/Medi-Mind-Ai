import axios from 'axios';
import readline from 'readline';
import env from '../config/environment';
import logger from '../config/logger';

export class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = env.GROQ_API_KEY || '';
  }

  public async chatCompletion(systemPrompt: string, userPrompt: string, responseFormat?: 'json_object') {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          response_format: responseFormat ? { type: responseFormat } : undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error(`Groq API Completion Error: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  public async visionCompletion(
    systemPrompt: string,
    prompt: string,
    fileBuffer: Buffer,
    mimeType: string
  ) {
    try {
      const base64 = fileBuffer.toString('base64');
      const response = await axios.post(
        this.baseUrl,
        {
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
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error(`Groq Vision API Error: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  public async chatCompletionStream(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (text: string) => void,
    onComplete: (fullText: string) => void
  ) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
      ];

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          responseType: 'stream',
        }
      );

      let fullResponseText = '';

      const rl = readline.createInterface({
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
          } catch (_) {}
        }
      });
    } catch (error: any) {
      logger.error(`Groq Streaming Error: ${error.message}`);
      throw error;
    }
  }
}

export const groqService = new GroqService();
export default groqService;
