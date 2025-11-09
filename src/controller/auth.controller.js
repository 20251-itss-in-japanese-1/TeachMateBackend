const authService = require('../service/auth.service');
class AuthController {
    register = async (req, res) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    login = async (req, res) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error.message,
                success: false
            });
        }
    }
    googleCallback = async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Xác thực thất bại" });
            }
            const { token } = req.user;
            console.log("Google OAuth token:", token);
            res.redirect(`http://localhost:3001/?token=${token}`);
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    logout = async (req, res) => {
        try {
            const result = await authService.logout(req.user.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                message: error.message || 'Internal Server Error',
                success: false
            });
        }
    }
}

module.exports = new AuthController();