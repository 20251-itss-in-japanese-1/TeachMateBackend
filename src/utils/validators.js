const mongoose = require('mongoose');

function isValidObjectId(id) {
	return !!id && mongoose.Types.ObjectId.isValid(id);
}

function normalizeSpecialties(input) {
	if (!input) return [];
	if (!Array.isArray(input)) input = [input];
	const cleaned = input
		.map(s => (typeof s === 'string' ? s.trim() : ''))
		.filter(Boolean);
	// dedupe and limit to 20 items
	const uniq = Array.from(new Set(cleaned));
	return uniq.slice(0, 20);
}

module.exports = { isValidObjectId, normalizeSpecialties };
