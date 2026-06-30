import { Schema, model, Document, Types } from 'mongoose';

export interface IChatSession extends Document {
  patientId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage extends Document {
  sessionId: Types.ObjectId;
  sender: 'user' | 'model';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export const ChatSession = model<IChatSession>('ChatSession', chatSessionSchema);
export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
