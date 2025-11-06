const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollVoteSchema = new Schema({
	pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	optionIndex: { type: Number, required: true, min: 0, max: 4 },
	votedAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', pollVoteSchema);
