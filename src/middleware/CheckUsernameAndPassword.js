class ValidateRegisterForm {
    handleReg(req, res, next) {
        try {
            const { name, email, password, nationality } = req.body;

            // 1. Name
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required.'
                });
            }

            // 2. Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email address.'
                });
            }

            // 3. Password
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required.'
                });
            }
            if (!passRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number or symbol.'
                });
            }

            // 4. Nationality
            if (!nationality || nationality.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Nationality is required.'
                });
            }

            next();

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Server error.'
            });
        }
    }
    handleLog(req, res, next) {
        try {
            const { email, password, nationality } = req.body;


            // 2. Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email address.'
                });
            }

            // 3. Password
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required.'
                });
            }
            if (!passRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, and a number or symbol.'
                });
            }

            // 4. Nationality
            if (!nationality || nationality.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Nationality is required.'
                });
            }

            next();

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Server error.'
            });
        }
    }
}

module.exports = new ValidateRegisterForm();
