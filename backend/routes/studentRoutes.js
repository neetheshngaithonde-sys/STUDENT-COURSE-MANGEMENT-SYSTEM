const express = require("express");

const router = express.Router();

const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} = require("../controllers/courseController");


// ================================
// Student Routes
// ================================

// GET all students
router.get("/", getStudents);

// GET student by ID
router.get("/:id", getStudentById);

// POST student
router.post("/", createStudent);

// PUT student
router.put("/:id", updateStudent);

// DELETE student
router.delete("/:id", deleteStudent);


module.exports = router;