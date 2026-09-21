const express = require("express");
const router = express.Router();

const {
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Admin routes
router.get("/", protect, authorize("admin"), getStudents);
router.delete("/:id", protect, authorize("admin"), deleteStudent);

// Student self or Admin routes
router.get("/:id", protect, getStudentById);
router.put("/:id", protect, updateStudent);

module.exports = router;