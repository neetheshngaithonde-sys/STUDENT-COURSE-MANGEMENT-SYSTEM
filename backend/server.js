const express = require("express");

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Server is running successfully"
    });
});

// GET all users
app.get("/api/users", (req, res) => {
    res.json([
        {
            id: 1,
            name: "User One",
            email: "user1@gmail.com"
        },
        {
            id: 2,
            name: "User Two",
            email: "user2@gmail.com"
        }
    ]);
});

// GET user by ID
app.get("/api/users/:id", (req, res) => {
    const userId = req.params.id;

    res.json({
        message: "User details",
        id: userId
    });
});

// POST user
app.post("/api/users", (req, res) => {
    const user = req.body;

    res.status(201).json({
        message: "User created successfully",
        user: user
    });
});

// PUT user
app.put("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;

    res.json({
        message: "User updated successfully",
        id: userId,
        user: updatedUser
    });
});

// DELETE user
app.delete("/api/users/:id", (req, res) => {
    const userId = req.params.id;

    res.json({
        message: "User deleted successfully",
        id: userId
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});