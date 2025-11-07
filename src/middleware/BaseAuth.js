const jwt = require('jsonwebtoken');

class BaseAuth {
	constructor() {
		this.secret = process.env.JWT_SECRET;
		if (!this.secret) console.error('Missing JWT_SECRET in env');
	}
	_verifyToken(req) {
		if (!this.secret) return { error: 'Server error', status: 500 };

		const auth = req.get('Authorization') || req.get('authorization');
		if (!auth) return { error: 'Authentication required', status: 401 };

		const parts = auth.split(' ');
		if (parts.length !== 2 || parts[0] !== 'Bearer')
			return { error: 'Invalid authorization format', status: 401 };

		const token = parts[1];
		try {
			const payload = jwt.verify(token, this.secret);
			return { payload };
		} catch (err) {
			return { error: 'Invalid or expired token', status: 401 };
		}
	}
	isAuthenticated(req, res, next) {
		const result = this._verifyToken(req);
		if (result.error) return res.status(result.status).json({ error: result.error });

		req.user = result.payload;
		next();
	}
}

module.exports = BaseAuth;
