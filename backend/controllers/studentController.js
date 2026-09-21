const Student = require("../models/studentModel");
const User = require("../models/userModel");
const Enrollment = require("../models/enrollmentModel");

// ==========================================
// @route   GET /api/students
// @desc    Get all students (searchable by name, email, studentId)
// @access  Private (Admin Only)
// ==========================================
const getStudents = async (req, res) => {
    try {
        const { search, department } = req.query;
        let query = {};

        if (department && department !== "All") {
            query.department = department;
        }

        let students = await Student.find(query)
            .populate("user", "name email role createdAt")
            .sort({ createdAt: -1 });

        // In-memory filter for populated user fields if search query is provided
        if (search) {
            const searchRegex = new RegExp(search, "i");
            students = students.filter(
                (s) =>
                    s.studentId.match(searchRegex) ||
                    (s.user && s.user.name.match(searchRegex)) ||
                    (s.user && s.user.email.match(searchRegex)) ||
                    s.department.match(searchRegex)
            );
        }

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
};

// ==========================================
// @route   GET /api/students/:id
// @desc    Get single student details with their enrollments
// @access  Private (Student self or Admin)
// ==========================================
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate(
            "user",
            "name email role createdAt"
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student record not found"
            });
        }

        // Fetch enrollments for this student
        const enrollments = await Enrollment.find({
            student: student.user._id
        }).populate("course");

        res.json({
            success: true,
            data: {
                student,
                enrollments
            }
        });
    } catch (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve student details"
        });
    }
};

// ==========================================
// @route   PUT /api/students/:id
// @desc    Update student profile
// @access  Private (Student self or Admin)
// ==========================================
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Only allow student themself or admin
        if (
            req.user.role !== "admin" &&
            student.user.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this profile"
            });
        }

        const { department, semester, phone, name } = req.body;

        if (department) student.department = department;
        if (semester) student.semester = semester;
        if (phone !== undefined) student.phone = phone;

        await student.save();

        // If name is also changed, update User model
        if (name) {
            await User.findByIdAndUpdate(student.user, { name });
        }

        const updated = await Student.findById(student._id).populate(
            "user",
            "name email role"
        );

        res.json({
            success: true,
            message: "Student profile updated successfully",
            data: updated
        });
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update student"
        });
    }
};

// ==========================================
// @route   DELETE /api/students/:id
// @desc    Delete student record and user account
// @access  Private (Admin Only)
// ==========================================
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Delete enrollments, student profile, and user
        await Enrollment.deleteMany({ student: student.user });
        await User.findByIdAndDelete(student.user);
        await Student.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Student account, enrollments, and profile deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent
};
