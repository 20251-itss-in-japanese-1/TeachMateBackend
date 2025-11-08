const jwt = require('jsonwebtoken');

class AuthMiddleware {
    // Middleware xác thực người dùng qua JWT
    isAuth(req, res, next) {
        try {
            const token =
                req.cookies?.token ||
                (req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null);

            console.log('\x1b[36m[AuthMiddleware]\x1b[0m Token:', token || '❌ No token');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided',
                });
            }

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('\x1b[32m[AuthMiddleware]\x1b[0m Decoded user:', decoded);

            req.user = decoded; // Gán user đã decode vào request
            next();
        } catch (error) {
            console.error('\x1b[31m[AuthMiddleware Error]\x1b[0m', error.message);

            // Kiểm tra loại lỗi để phản hồi chính xác hơn
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }

            return res.status(500).json({ success: false, message: 'Authentication failed' });
        }
    }

    // Middleware kiểm tra quyền admin
    isAdmin(req, res, next) {
        console.log('\x1b[35m[AuthMiddleware]\x1b[0m Checking admin role for user:', req.user);

        if (req.user && req.user.role === 'admin') {
            console.log('\x1b[32m[AuthMiddleware]\x1b[0m ✅ User is admin');
            next();
        } else {
            console.warn('\x1b[33m[AuthMiddleware]\x1b[0m ❌ Forbidden: Admin role required');
            return res.status(403).json({
                success: false,
                message: 'Forbidden: admin role required',
            });
        }
    }
}

module.exports = new AuthMiddleware();
