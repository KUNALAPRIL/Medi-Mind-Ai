import { Schema, model } from 'mongoose';

const tokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['REFRESH', 'VERIFICATION', 'PASSWORD_RESET'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically delete document when current date passes expiresAt
    },
  },
  {
    timestamps: true,
  }
);

export const Token = model('Token', tokenSchema);
export default Token;
