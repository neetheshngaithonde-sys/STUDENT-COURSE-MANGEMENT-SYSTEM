const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        department: {
            type: String,
            default: "Computer Science"
        },
        semester: {
            type: Number,
            default: 4,
            min: 1,
            max: 8
        },
        phone: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);
