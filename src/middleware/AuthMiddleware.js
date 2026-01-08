const jwt = require('jsonwebtoken');

class AuthMiddleware {
    // Middleware xác thực người dùng qua JWT
    isAuth(req, res, next) {
        try {
            const token =
                req.cookies?.token ||
                (req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided',
                });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; 
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }

            return res.status(500).json({ success: false, message: 'Authentication failed' });
        }
    }
    isAdmin(req, res, next) {
        console.log('\x1b[35m[AuthMiddleware]\x1b[0m Checking admin role for user:', req.user);

        if (req.user && req.user.role === 'admin') {
            next();
        } else {;
            return res.status(403).json({
                success: false,
                message: 'Forbidden: admin role required',
            });
        }
    }
}

module.exports = new AuthMiddleware();
