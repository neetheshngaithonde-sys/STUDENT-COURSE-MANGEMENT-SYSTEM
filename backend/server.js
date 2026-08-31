const express = require("express");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

const PORT = 5000;


// ================================
// Middleware
// ================================

// Parse JSON request body
app.use(express.json());

// Custom Logger Middleware
app.use(logger);


// ================================
// Routes
// ================================

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Server is running successfully"
    });
});

// Student API routes
app.use("/api/students", studentRoutes);


// ================================
// 404 Error Handler
// ================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


// ================================
// General Error Handler
// ================================

app.use(errorHandler);


// ================================
// Start Server
// ================================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});