const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUri =
            process.env.MONGO_URI ||
            "mongodb://127.0.0.1:27017/student_course_management";

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully to:", mongoUri);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;