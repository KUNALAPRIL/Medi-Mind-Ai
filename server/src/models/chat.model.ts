import { Schema, model } from 'mongoose';

const chatSessionSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const chatMessageSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    sender: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export const ChatSession = model('ChatSession', chatSessionSchema);
export const ChatMessage = model('ChatMessage', chatMessageSchema);
