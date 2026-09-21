const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },
        enrollmentDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ["enrolled", "completed", "dropped"],
            default: "enrolled"
        },
        grade: {
            type: String,
            default: "In Progress"
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate enrollment of the same student in the same course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
