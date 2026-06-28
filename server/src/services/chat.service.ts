import { ChatSession, ChatMessage } from '../models/chat.model';
import groqService from './groq.service';
import { BadRequestError } from '../errors/app-error';
import logger from '../config/logger';

export class ChatService {
  public async getSessions(userId: string) {
    return ChatSession.find({ patientId: userId }).sort({ updatedAt: -1 });
  }

  public async createSession(userId: string, title: string) {
    const session = new ChatSession({ patientId: userId, title });
    await session.save();
    return session;
  }

  public async deleteSession(sessionId: string) {
    await ChatMessage.deleteMany({ sessionId });
    await ChatSession.deleteOne({ _id: sessionId });
  }

  public async getMessages(sessionId: string) {
    return ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
  }

  public async streamResponse(
    sessionId: string,
    messageContent: string,
    onChunk: (text: string) => void,
    onComplete: (fullResponseText: string) => void,
    lang = 'en'
  ) {
    // 1. Fetch Session and Past Messages History
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      throw new BadRequestError('Chat session not found');
    }

    const pastMessages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });

    // Format for OpenAI format: Array of { role: 'user'|'assistant', content: string }
    const history = pastMessages.map((msg) => ({
      role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));

    // 2. Save incoming User Message
    const userMessage = new ChatMessage({
      sessionId,
      sender: 'user',
      content: messageContent,
    });
    await userMessage.save();

    // Trigger update on session timestamp
    await ChatSession.updateOne({ _id: sessionId }, { $set: { updatedAt: new Date() } });

    let systemInstruction = `You are MediMind AI, a secure clinical health assistant. Answer queries factually and supportively. Provide clear explanations. When requested, write parameters in markdown tables. If symptoms display high emergency indicators (e.g. sudden severe chest pain, extreme breathlessness), output warning disclaimers advising immediate emergency care contact. Never confirm a final diagnosis; frame suggestions as educational considerations.`;
    
    if (lang === 'hi') {
      systemInstruction += ` IMPORTANT: Output your entire response strictly in Hindi language (हिंदी भाषा). Explain medical terms in simple Hindi.`;
    }

    try {
      await groqService.chatCompletionStream(
        systemInstruction,
        history,
        onChunk,
        async (fullResponseText) => {
          const cleanText = fullResponseText ? fullResponseText.trim() : '...';
          // Save Model response to database
          const modelMessage = new ChatMessage({
            sessionId,
            sender: 'model',
            content: cleanText,
          });
          await modelMessage.save();
          onComplete(cleanText);
        }
      );
    } catch (error) {
      logger.error(`Groq Chat stream execution failure: ${error}`);
      
      // Fallback response if API fails
      const fallbackReply = `This is a temporary fallback response. The AI service encountered a connection issue. Please check your API key.`;
      onChunk(fallbackReply);
      onComplete(fallbackReply);

      const modelMessage = new ChatMessage({
        sessionId,
        sender: 'model',
        content: fallbackReply,
      });
      await modelMessage.save();
    }
  }
}

export const chatService = new ChatService();
export default chatService;
