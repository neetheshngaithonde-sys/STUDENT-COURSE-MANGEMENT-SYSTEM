// Load environment variables
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

// Middleware
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

// Database
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");

const app = express();

// Port
const PORT = process.env.PORT || 5000;

// ========================================
// DATABASE
// ========================================

connectDB();

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logger);

// ========================================
// FRONTEND
// ========================================

const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// ========================================
// API HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        project: "Student Course Management System",
        status: "Online",
        timestamp: new Date().toISOString()
    });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/enrollments", enrollmentRoutes);

// ========================================
// FRONTEND FALLBACK
// ========================================

app.use((req, res, next) => {

    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: "API Route not found"
        });
    }

    res.sendFile(
        path.join(frontendPath, "index.html"),
        (err) => {
            if (err) {
                next(err);
            }
        }
    );
});

// ========================================
// ERROR HANDLER
// ========================================

app.use(errorHandler);

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log("=========================================");
    console.log(" Student Course Management System Server ");
    console.log(` Running on: http://localhost:${PORT}`);
    console.log("=========================================");
});
