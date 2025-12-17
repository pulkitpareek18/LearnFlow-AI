import mongoose, { Schema, Model } from 'mongoose';
import { IAIConversation, ChatMessage } from '@/types';

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AIConversationSchema = new Schema<IAIConversation>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    context: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for faster queries
AIConversationSchema.index({ studentId: 1 });
AIConversationSchema.index({ moduleId: 1 });
AIConversationSchema.index({ studentId: 1, moduleId: 1 });

const AIConversation: Model<IAIConversation> =
  mongoose.models.AIConversation || mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);

export default AIConversation;
