const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true
        },
        code: {
            type: String,
            required: [true, "Course code is required"],
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            required: [true, "Course description is required"]
        },
        instructor: {
            type: String,
            required: [true, "Instructor name is required"],
            trim: true
        },
        category: {
            type: String,
            required: [true, "Course category is required"],
            enum: [
                "Computer Science",
                "Data Science",
                "Artificial Intelligence",
                "Web Development",
                "Cloud & DevOps",
                "Cybersecurity",
                "General"
            ],
            default: "Computer Science"
        },
        credits: {
            type: Number,
            required: [true, "Credits are required"],
            min: 1,
            max: 6,
            default: 3
        },
        capacity: {
            type: Number,
            required: [true, "Capacity is required"],
            min: 1,
            default: 40
        },
        enrolledCount: {
            type: Number,
            default: 0,
            min: 0
        },
        schedule: {
            type: String,
            default: "Mon / Wed 10:00 AM - 11:30 AM"
        },
        syllabus: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Virtual to check if course is full
courseSchema.virtual("isFull").get(function () {
    return this.enrolledCount >= this.capacity;
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
