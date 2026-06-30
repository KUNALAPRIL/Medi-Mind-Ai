"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const chat_model_1 = require("../models/chat.model");
const groq_service_1 = __importDefault(require("./groq.service"));
const app_error_1 = require("../errors/app-error");
const logger_1 = __importDefault(require("../config/logger"));
class ChatService {
    async getSessions(userId) {
        return chat_model_1.ChatSession.find({ patientId: userId }).sort({ updatedAt: -1 });
    }
    async createSession(userId, title) {
        const session = new chat_model_1.ChatSession({ patientId: userId, title });
        await session.save();
        return session;
    }
    async deleteSession(sessionId) {
        await chat_model_1.ChatMessage.deleteMany({ sessionId });
        await chat_model_1.ChatSession.deleteOne({ _id: sessionId });
    }
    async getMessages(sessionId) {
        return chat_model_1.ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    }
    async streamResponse(sessionId, messageContent, onChunk, onComplete, lang = 'en') {
        // 1. Fetch Session and Past Messages History
        const session = await chat_model_1.ChatSession.findById(sessionId);
        if (!session) {
            throw new app_error_1.BadRequestError('Chat session not found');
        }
        const pastMessages = await chat_model_1.ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
        // Format for OpenAI format: Array of { role: 'user'|'assistant', content: string }
        const history = pastMessages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));
        // 2. Save incoming User Message
        const userMessage = new chat_model_1.ChatMessage({
            sessionId,
            sender: 'user',
            content: messageContent,
        });
        await userMessage.save();
        // Trigger update on session timestamp
        await chat_model_1.ChatSession.updateOne({ _id: sessionId }, { $set: { updatedAt: new Date() } });
        let systemInstruction = `You are MediMind AI, a secure clinical health assistant. Answer queries factually and supportively. Provide clear explanations. When requested, write parameters in markdown tables. If symptoms display high emergency indicators (e.g. sudden severe chest pain, extreme breathlessness), output warning disclaimers advising immediate emergency care contact. Never confirm a final diagnosis; frame suggestions as educational considerations.`;
        if (lang === 'hi') {
            systemInstruction += ` IMPORTANT: Output your entire response strictly in Hindi language (हिंदी भाषा). Explain medical terms in simple Hindi.`;
        }
        try {
            await groq_service_1.default.chatCompletionStream(systemInstruction, history, onChunk, async (fullResponseText) => {
                const cleanText = fullResponseText ? fullResponseText.trim() : '...';
                // Save Model response to database
                const modelMessage = new chat_model_1.ChatMessage({
                    sessionId,
                    sender: 'model',
                    content: cleanText,
                });
                await modelMessage.save();
                onComplete(cleanText);
            });
        }
        catch (error) {
            logger_1.default.error(`Groq Chat stream execution failure: ${error}`);
            // Fallback response if API fails
            const fallbackReply = `This is a temporary fallback response. The AI service encountered a connection issue. Please check your API key.`;
            onChunk(fallbackReply);
            onComplete(fallbackReply);
            const modelMessage = new chat_model_1.ChatMessage({
                sessionId,
                sender: 'model',
                content: fallbackReply,
            });
            await modelMessage.save();
        }
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
exports.default = exports.chatService;
