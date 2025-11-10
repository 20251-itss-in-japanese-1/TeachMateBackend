const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollOptionSchema = new Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },  
  voters: [{ type: Schema.Types.ObjectId, ref: 'User' }] 
}, { _id: true });


const pollSchema = new Schema({
  threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true }, 
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true, maxlength: 100 },
  options: { type: [pollOptionSchema], required: true, validate: v => v.length >= 2 },
  isActive: { type: Boolean, default: true }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });


pollSchema.index({ threadId: 1, createdAt: -1 });

module.exports = mongoose.model('Poll', pollSchema);
