// ================================
// Student Controller
// ================================

// GET all students
const getStudents = (req, res) => {
    res.json([
        {
            id: 1,
            name: "Student One",
            email: "student1@gmail.com"
        },
        {
            id: 2,
            name: "Student Two",
            email: "student2@gmail.com"
        }
    ]);
};


// GET student by ID
const getStudentById = (req, res) => {
    const studentId = req.params.id;

    res.json({
        success: true,
        message: "Student details",
        id: studentId
    });
};


// POST student
const createStudent = (req, res) => {
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: "Name and email are required"
        });
    }

    const student = {
        name: name,
        email: email
    };

    res.status(201).json({
        success: true,
        message: "Student created successfully",
        student: student
    });
};


// PUT student
const updateStudent = (req, res) => {
    const studentId = req.params.id;
    const updatedStudent = req.body;

    res.json({
        success: true,
        message: "Student updated successfully",
        id: studentId,
        student: updatedStudent
    });
};


// DELETE student
const deleteStudent = (req, res) => {
    const studentId = req.params.id;

    res.json({
        success: true,
        message: "Student deleted successfully",
        id: studentId
    });
};


// Export controller functions
module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};