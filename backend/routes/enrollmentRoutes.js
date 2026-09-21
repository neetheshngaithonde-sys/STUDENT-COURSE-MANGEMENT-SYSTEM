const express = require("express");
const router = express.Router();

const {
    enrollCourse,
    getMyEnrollments,
    getAllEnrollments,
    withdrawEnrollment,
    updateEnrollmentStatus
} = require("../controllers/enrollmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Student routes
router.post("/", protect, enrollCourse);
router.get("/my", protect, getMyEnrollments);
router.delete("/:id", protect, withdrawEnrollment);

// Admin routes
router.get("/", protect, authorize("admin"), getAllEnrollments);
router.put("/:id", protect, authorize("admin"), updateEnrollmentStatus);

module.exports = router;
