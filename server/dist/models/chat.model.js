"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.ChatSession = void 0;
const mongoose_1 = require("mongoose");
const chatSessionSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
}, { timestamps: true });
const chatMessageSchema = new mongoose_1.Schema({
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    sender: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
}, { timestamps: true });
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
exports.ChatSession = (0, mongoose_1.model)('ChatSession', chatSessionSchema);
exports.ChatMessage = (0, mongoose_1.model)('ChatMessage', chatMessageSchema);
