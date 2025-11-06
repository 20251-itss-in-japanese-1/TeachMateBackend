const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const url = process.env.TEACHMATE_DATABASE_URL
        if (!url) {
            throw new Error("Missing TEACHMATE_DATABASE_URL in environment variables");
        }
        await mongoose.connect(url)
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}
module.exports = connectDB;