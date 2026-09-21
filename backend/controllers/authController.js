const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// Helper to generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, {
        expiresIn: "30d"
    });
};

// ==========================================
// @route   POST /api/auth/register
// @desc    Register a new user (Student / Admin)
// @access  Public
// ==========================================
const register = async (req, res) => {
    try {
        const { name, email, password, role, department, semester, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, and password"
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Create user
        const assignedRole = role === "admin" ? "admin" : "student";
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: assignedRole
        });

        // If student, create student profile
        if (assignedRole === "student") {
            const studentCount = await Student.countDocuments();
            const studentId = `STU-2026-${String(studentCount + 1).padStart(3, "0")}`;

            await Student.create({
                user: user._id,
                studentId,
                department: department || "Computer Science",
                semester: semester || 1,
                phone: phone || ""
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error during registration"
        });
    }
};

// ==========================================
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password using bcrypt
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Get student details if student
        let studentDetails = null;
        if (user.role === "student") {
            studentDetails = await Student.findOne({ user: user._id });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentProfile: studentDetails
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error during login"
        });
    }
};

// ==========================================
// @route   GET /api/auth/me
// @desc    Get current logged in user details
// @access  Private (Protected)
// ==========================================
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        let studentProfile = null;

        if (user.role === "student") {
            studentProfile = await Student.findOne({ user: user._id });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                studentProfile
            }
        });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error fetching profile"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
