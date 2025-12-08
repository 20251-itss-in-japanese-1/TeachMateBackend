const mongoose = require('mongoose');
const { Schema } = mongoose;

const attachmentSchema = new Schema({
  kind: { type: String, enum: ['image', 'file', 'link'], required: true },
  mime: String,
  url: String
}, { _id: false });

const messageSchema = new Schema({
  threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentType: { type: String, enum: ['text', 'schedule', 'poll', 'file'], default: 'text' },

  content: { type: String, maxlength: 2000 }, 
  attachments: { type: [attachmentSchema], default: [] },

  scheduleId: { type: Schema.Types.ObjectId, ref: 'ChatSchedule', default: null },
  pollId: { type: Schema.Types.ObjectId, ref: 'Poll', default: null },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  reactions: { type: [String], default: [] },
  deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
