const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");

// ==========================================
// @route   GET /api/courses
// @desc    Get all courses with filtering, search & sorting
// @access  Public
// ==========================================
const getCourses = async (req, res) => {
    try {
        const { search, category, credits, sort } = req.query;
        const query = {};

        // Category filter
        if (category && category !== "All") {
            query.category = category;
        }

        // Search filter (title, code, instructor, or description)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
                { instructor: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Credits filter
        if (credits) {
            query.credits = Number(credits);
        }

        // Sorting
        let sortBy = { createdAt: -1 };
        if (sort === "credits_asc") sortBy = { credits: 1 };
        else if (sort === "credits_desc") sortBy = { credits: -1 };
        else if (sort === "title_asc") sortBy = { title: 1 };
        else if (sort === "title_desc") sortBy = { title: -1 };
        else if (sort === "popular") sortBy = { enrolledCount: -1 };

        const courses = await Course.find(query).sort(sortBy);

        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve courses"
        });
    }
};

// ==========================================
// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
// ==========================================
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve course details"
        });
    }
};

// ==========================================
// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin Only)
// ==========================================
const createCourse = async (req, res) => {
    try {
        const {
            title,
            code,
            description,
            instructor,
            category,
            credits,
            capacity,
            schedule,
            syllabus
        } = req.body;

        if (!title || !code || !description || !instructor) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, code, description, and instructor"
            });
        }

        // Check if course code already exists
        const existingCourse = await Course.findOne({ code: code.toUpperCase() });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: `Course with code ${code.toUpperCase()} already exists`
            });
        }

        const course = await Course.create({
            title,
            code: code.toUpperCase(),
            description,
            instructor,
            category: category || "Computer Science",
            credits: credits || 3,
            capacity: capacity || 40,
            schedule: schedule || "Mon / Wed 10:00 AM - 11:30 AM",
            syllabus: syllabus || []
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: course
        });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create course"
        });
    }
};

// ==========================================
// @route   PUT /api/courses/:id
// @desc    Update course by ID
// @access  Private (Admin Only)
// ==========================================
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (req.body.code && req.body.code.toUpperCase() !== course.code) {
            const codeExists = await Course.findOne({
                code: req.body.code.toUpperCase(),
                _id: { $ne: course._id }
            });
            if (codeExists) {
                return res.status(400).json({
                    success: false,
                    message: `Course code ${req.body.code.toUpperCase()} is already in use`
                });
            }
            req.body.code = req.body.code.toUpperCase();
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse
        });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update course"
        });
    }
};

// ==========================================
// @route   DELETE /api/courses/:id
// @desc    Delete course by ID
// @access  Private (Admin Only)
// ==========================================
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Remove course enrollments
        await Enrollment.deleteMany({ course: course._id });
        await Course.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Course '${course.title}' and associated enrollments deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete course"
        });
    }
};

// ==========================================
// @route   GET /api/courses/stats/summary
// @desc    Get overall course statistics
// @access  Public
// ==========================================
const getCourseStats = async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments({ status: "enrolled" });
        const categories = await Course.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                totalCourses,
                totalEnrollments,
                categories
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve statistics"
        });
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseStats
};