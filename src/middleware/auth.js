const jwt = require('jsonwebtoken');
const path = require('path');
// ensure env loaded if server didn't already
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const secret = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
	if (!secret) {
		console.error('Missing JWT_SECRET in env');
		return res.status(500).json({ error: 'Server error' });
	}

	const auth = req.get('Authorization') || req.get('authorization');
	if (!auth) return res.status(401).json({ error: 'Authentication required' });

	const parts = auth.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });

	const token = parts[1];
	try {
		const payload = jwt.verify(token, secret);
		req.user = payload; // controller expects req.user.sub
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};
