const BaseAuth = require('./BaseAuth');

class AuthMiddleware extends BaseAuth {
	constructor() {
		super(); 
	}
	_hasRole(roles = []) {
		return (req, res, next) => {
			const result = this._verifyToken(req);
			if (result.error) return res.status(result.status).json({ error: result.error });

			req.user = result.payload;
			if (!roles.includes(req.user.role))
				return res.status(403).json({ error: 'Forbidden: insufficient role' });

			next();
		};
	}
	isAdmin = this._hasRole(['admin']);
	isUser = this._hasRole(['user']);
}

module.exports = new AuthMiddleware();
