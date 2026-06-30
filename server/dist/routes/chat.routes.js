"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const chat_service_1 = __importDefault(require("../services/chat.service"));
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.use(auth_middleware_1.authenticate);
exports.chatRouter.get('/sessions', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context missing' });
            return;
        }
        const sessions = await chat_service_1.default.getSessions(userId);
        res.status(200).json({ status: 'success', data: sessions });
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.post('/sessions', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        const { title } = req.body;
        if (!userId || !title) {
            res.status(400).json({ status: 'error', message: 'User ID and session title are required' });
            return;
        }
        const session = await chat_service_1.default.createSession(userId, title);
        res.status(201).json({ status: 'success', data: session });
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.delete('/sessions/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        await chat_service_1.default.deleteSession(sessionId);
        res.status(200).json({ status: 'success', message: 'Chat session deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.get('/sessions/:sessionId/messages', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const messages = await chat_service_1.default.getMessages(sessionId);
        res.status(200).json({ status: 'success', data: messages });
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.post('/sessions/:sessionId/stream', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ status: 'error', message: 'Message content is required' });
            return;
        }
        // Set headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en');
        await chat_service_1.default.streamResponse(sessionId, message, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }, (completeText) => {
            res.write(`data: [DONE]\n\n`);
            res.end();
        }, lang);
    }
    catch (error) {
        // If headers are already sent, close stream, else delegate to global error handler
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
            res.end();
        }
        else {
            next(error);
        }
    }
});
exports.default = exports.chatRouter;
