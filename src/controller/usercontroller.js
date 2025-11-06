const userService = require('../service/userService');
const authService = require('../service/auth.service'); // use existing service, do not modify it

class UserController {
	constructor(service) {
		this.service = service;
		this.viewProfile = this.viewProfile.bind(this);
		this.register = this.register.bind(this);
		this.login = this.login.bind(this);
		this.editProfile = this.editProfile.bind(this);
		this.viewTeacherProfile = this.viewTeacherProfile.bind(this);
	}

	// POST /auth/register
	async register(req, res) {
		try {
			const payload = req.body || {};
			const result = await authService.register(payload);
			// auth.service.register returns an object on success
			return res.status(201).json(result);
		} catch (err) {
			// map common error messages to appropriate status codes
			const msg = (err && err.message) ? err.message : 'Server error';
			if (msg.includes('required')) return res.status(400).json({ error: msg });
			if (msg.includes('already exists')) return res.status(409).json({ error: msg });
			console.error('register controller error', err);
			return res.status(500).json({ error: 'Server error' });
		}
	}

	// POST /auth/login
	async login(req, res) {
		try {
			const payload = req.body || {};
			const result = await authService.login(payload);
			// auth.service.login returns { success, message, data: { user, token } }
			return res.json(result);
		} catch (err) {
			const msg = (err && err.message) ? err.message : 'Server error';
			if (msg.includes('required') || msg.includes('Invalid')) return res.status(400).json({ error: msg });
			// invalid credentials
			if (msg.includes('Invalid email or password')) return res.status(401).json({ error: msg });
			console.error('login controller error', err);
			return res.status(500).json({ error: 'Server error' });
		}
	}

	// PUT /profile or PUT /users/:id/profile
	async editProfile(req, res) {
		try {
			const authUserId = req.user && req.user.sub;
			if (!authUserId) return res.status(401).json({ error: 'Authentication required' });

			// target id may be in params; user can only edit their own profile
			const targetId = (req.params && (req.params.id || req.params.userId)) || req.body.userId || authUserId;
			if (String(targetId) !== String(authUserId)) {
				return res.status(403).json({ error: 'Forbidden' });
			}

			const payload = req.body || {};
			const updatedProfile = await this.service.updateProfile({ userId: authUserId, payload });
			return res.json(updatedProfile);
		} catch (err) {
			const EN = {
				400: 'Invalid user id',
				401: 'Authentication required',
				403: 'Forbidden',
				404: 'Profile not found',
				500: 'Server error'
			};

			if (err && err.status) {
				const message = EN[err.status] || 'Server error';
				return res.status(err.status).json({ error: message });
			}
			console.error('editProfile controller unexpected error', err);
			return res.status(500).json({ error: 'Server error' });
		}
	}

	// GET /profile or GET /users/:id/profile
	async viewProfile(req, res) {
		try {
			// prefer explicit param id, then query.userId, then authenticated user (req.user.sub)
			const id = (req.params && (req.params.id || req.params.userId)) || req.query.userId || (req.user && req.user.sub);
			const profile = await this.service.getProfile({ userId: id });
			return res.json(profile);
		} catch (err) {
			const EN = {
				400: 'Invalid user id',
				404: 'Profile not found',
				500: 'Server error'
			};

			if (err && err.status) {
				const message = EN[err.status] || 'Server error';
				return res.status(err.status).json({ error: message, needSignup: !!err.needSignup });
			}

			console.error('viewProfile controller unexpected error', err);
			return res.status(500).json({ error: 'Server error' });
		}
	}

	// GET /teachers/:id/profile
	async viewTeacherProfile(req, res) {
		try {
			const teacherId = (req.params && (req.params.id || req.params.userId)) || req.query.userId;
			const viewerId = req.user && req.user.sub; // may be undefined for unauthenticated users
			const profile = await this.service.getTeacherProfile({ viewerId, teacherId });
			return res.json(profile);
		} catch (err) {
			const EN = {
				400: 'Invalid teacher id',
				401: 'Authentication required',
				403: 'Forbidden',
				404: 'Profile not found',
				500: 'Server error'
			};

			if (err && err.status) {
				const message = EN[err.status] || 'Server error';
				return res.status(err.status).json({ error: message });
			}
			console.error('viewTeacherProfile controller unexpected error', err);
			return res.status(500).json({ error: 'Server error' });
		}
	}
}

module.exports = new UserController(userService);