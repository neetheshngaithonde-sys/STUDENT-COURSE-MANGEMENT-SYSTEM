const Enrollment = require("../models/enrollmentModel");
const Course = require("../models/courseModel");

// ==========================================
// @route   POST /api/enrollments
// @desc    Enroll logged in student in a course
// @access  Private (Student)
// ==========================================
const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required to enroll"
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if course capacity is reached
        if (course.enrolledCount >= course.capacity) {
            return res.status(400).json({
                success: false,
                message: "Course capacity is full. Cannot enroll at this time."
            });
        }

        // Check if student is already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId
        });

        if (existingEnrollment) {
            if (existingEnrollment.status === "enrolled") {
                return res.status(400).json({
                    success: false,
                    message: "You are already enrolled in this course"
                });
            } else if (existingEnrollment.status === "dropped") {
                // Re-activate enrollment
                existingEnrollment.status = "enrolled";
                existingEnrollment.enrollmentDate = new Date();
                await existingEnrollment.save();

                course.enrolledCount += 1;
                await course.save();

                return res.json({
                    success: true,
                    message: "Re-enrolled in course successfully",
                    data: existingEnrollment
                });
            }
        }

        // Create new enrollment
        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: courseId,
            status: "enrolled"
        });

        // Increment course enrolled count
        course.enrolledCount += 1;
        await course.save();

        const populated = await Enrollment.findById(enrollment._id).populate("course");

        res.status(201).json({
            success: true,
            message: `Successfully enrolled in ${course.title}`,
            data: populated
        });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to process enrollment"
        });
    }
};

// ==========================================
// @route   GET /api/enrollments/my
// @desc    Get all enrolled courses for current logged in student
// @access  Private (Student)
// ==========================================
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({
            student: req.user._id
        })
            .populate("course")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        console.error("Error fetching my enrollments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve your enrollments"
        });
    }
};

// ==========================================
// @route   GET /api/enrollments
// @desc    Get all enrollments in system (Admin)
// @access  Private (Admin Only)
// ==========================================
const getAllEnrollments = async (req, res) => {
    try {
        const { status, courseId } = req.query;
        let query = {};

        if (status && status !== "All") {
            query.status = status;
        }

        if (courseId) {
            query.course = courseId;
        }

        const enrollments = await Enrollment.find(query)
            .populate("student", "name email")
            .populate("course", "title code credits capacity enrolledCount")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (error) {
        console.error("Error fetching all enrollments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve enrollments"
        });
    }
};

// ==========================================
// @route   DELETE /api/enrollments/:id
// @desc    Withdraw/Drop from course
// @access  Private (Student or Admin)
// ==========================================
const withdrawEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment record not found"
            });
        }

        // Verify user ownership or admin
        if (
            req.user.role !== "admin" &&
            enrollment.student.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to modify this enrollment"
            });
        }

        // Decrement course count if currently enrolled
        if (enrollment.status === "enrolled") {
            await Course.findByIdAndUpdate(enrollment.course, {
                $inc: { enrolledCount: -1 }
            });
        }

        enrollment.status = "dropped";
        await enrollment.save();

        res.json({
            success: true,
            message: "Successfully withdrawn from the course",
            data: enrollment
        });
    } catch (error) {
        console.error("Error withdrawing enrollment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to withdraw from course"
        });
    }
};

// ==========================================
// @route   PUT /api/enrollments/:id
// @desc    Update enrollment status and grade (Admin)
// @access  Private (Admin Only)
// ==========================================
const updateEnrollmentStatus = async (req, res) => {
    try {
        const { status, grade } = req.body;
        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment record not found"
            });
        }

        if (status) enrollment.status = status;
        if (grade) enrollment.grade = grade;

        await enrollment.save();

        const updated = await Enrollment.findById(enrollment._id)
            .populate("student", "name email")
            .populate("course", "title code credits");

        res.json({
            success: true,
            message: "Enrollment updated successfully",
            data: updated
        });
    } catch (error) {
        console.error("Error updating enrollment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update enrollment"
        });
    }
};

module.exports = {
    enrollCourse,
    getMyEnrollments,
    getAllEnrollments,
    withdrawEnrollment,
    updateEnrollmentStatus
};
