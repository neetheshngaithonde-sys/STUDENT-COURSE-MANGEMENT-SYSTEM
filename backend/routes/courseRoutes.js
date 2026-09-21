const express = require("express");
const router = express.Router();

const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseStats
} = require("../controllers/courseController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/stats/summary", getCourseStats);
router.get("/", getCourses);
router.get("/:id", getCourseById);

// Protected Admin endpoints
router.post("/", protect, authorize("admin"), createCourse);
router.put("/:id", protect, authorize("admin"), updateCourse);
router.delete("/:id", protect, authorize("admin"), deleteCourse);

module.exports = router;
