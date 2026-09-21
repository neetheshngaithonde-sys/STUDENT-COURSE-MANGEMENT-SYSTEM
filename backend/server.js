// Load environment variables
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const app = express();

// Port from .env
const PORT = process.env.PORT || 5000;

// ================================
// Connect to Database
// ================================
connectDB();

// ================================
// Global Middleware
// ================================
// Enable CORS for all incoming origins
app.use(cors());

// Parse JSON and urlencoded request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Logger Middleware
app.use(logger);

// Serve Static Frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend")));

// ================================
// API Routes
// ================================
// Health Check / API info
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        project: "Student Course Management System",
        progression: "Week 1 to Week 7 Completed",
        status: "Online",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/enrollments", enrollmentRoutes);

// Fallback to frontend index.html for single-page app routes
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: "API Route not found"
        });
    }
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================================
// General Error Handler
// ================================
app.use(errorHandler);

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Student Course Management System Server `);
    console.log(` Running on: http://localhost:${PORT}     `);
    console.log(`=========================================`);
});