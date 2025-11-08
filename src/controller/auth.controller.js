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
}

module.exports = new AuthController();