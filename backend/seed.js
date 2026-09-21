const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const User = require("./models/userModel");
const Student = require("./models/studentModel");
const Course = require("./models/courseModel");
const Enrollment = require("./models/enrollmentModel");
const connectDB = require("./config/db");

const seedData = async () => {
    try {
        await connectDB();

        console.log("Clearing existing records...");
        await Enrollment.deleteMany({});
        await Student.deleteMany({});
        await Course.deleteMany({});
        await User.deleteMany({});

        console.log("Seeding Users...");
        // 1. Admin User
        const admin = await User.create({
            name: "College Administrator",
            email: "admin@college.edu",
            password: "admin123",
            role: "admin"
        });

        // 2. Student User 1
        const student1 = await User.create({
            name: "Aarav Sharma",
            email: "aarav@student.edu",
            password: "student123",
            role: "student"
        });

        await Student.create({
            user: student1._id,
            studentId: "STU-2026-001",
            department: "Computer Science",
            semester: 4,
            phone: "+91 98765 43210"
        });

        // 3. Student User 2
        const student2 = await User.create({
            name: "Priya Patel",
            email: "priya@student.edu",
            password: "student123",
            role: "student"
        });

        await Student.create({
            user: student2._id,
            studentId: "STU-2026-002",
            department: "Data Science & AI",
            semester: 6,
            phone: "+91 98123 45678"
        });

        console.log("Seeding Courses...");
        const courses = await Course.create([
            {
                title: "Data Structures & Algorithms in C++",
                code: "CS101",
                description: "Master fundamental data structures including trees, graphs, heaps, and advanced algorithmic design paradigms with real-world problem solving.",
                instructor: "Dr. Alan Turing",
                category: "Computer Science",
                credits: 4,
                capacity: 45,
                enrolledCount: 1,
                schedule: "Mon / Wed 09:00 AM - 10:30 AM",
                syllabus: [
                    "Arrays, Linked Lists, & Complexity Analysis",
                    "Stacks, Queues & Recursion",
                    "Binary Search Trees, AVL Trees, & Heaps",
                    "Graph Traversals (BFS, DFS) & Shortest Path",
                    "Dynamic Programming & Greedy Techniques"
                ]
            },
            {
                title: "Full Stack Web Development with MERN",
                code: "CS204",
                description: "Complete modern web development pipeline covering React 19, Node.js, Express RESTful APIs, MongoDB Atlas, and secure JWT authentication.",
                instructor: "Prof. Sarah Connor",
                category: "Web Development",
                credits: 4,
                capacity: 40,
                enrolledCount: 2,
                schedule: "Tue / Thu 11:00 AM - 12:30 PM",
                syllabus: [
                    "Modern JavaScript (ES6+), DOM, and Async/Await",
                    "React Component Lifecycle, Hooks & State Management",
                    "Express.js Architecture, Middleware & Routing",
                    "MongoDB Schema Design & Mongoose ODM",
                    "Full Stack Integration & Production Deployment"
                ]
            },
            {
                title: "Deep Learning & Generative AI",
                code: "AI301",
                description: "Explore state-of-the-art neural network architectures, PyTorch, Convolutional Networks, Attention Transformers, and Large Language Models.",
                instructor: "Dr. Geoffrey Hinton",
                category: "Artificial Intelligence",
                credits: 4,
                capacity: 35,
                enrolledCount: 1,
                schedule: "Mon / Fri 02:00 PM - 03:30 PM",
                syllabus: [
                    "Perceptrons & Multi-Layer Neural Networks",
                    "Backpropagation and Optimization (Adam, SGD)",
                    "CNNs for Computer Vision & Object Recognition",
                    "Transformer Models, Attention Mechanism & LLMs",
                    "Generative Diffusion and Fine-tuning"
                ]
            },
            {
                title: "Applied Data Science & Machine Learning",
                code: "DS202",
                description: "Practical data science workflow utilizing NumPy, Pandas, Scikit-Learn, statistical hypothesis testing, and predictive model deployment.",
                instructor: "Dr. Andrew Ng",
                category: "Data Science",
                credits: 3,
                capacity: 50,
                enrolledCount: 0,
                schedule: "Wed / Fri 10:00 AM - 11:30 AM",
                syllabus: [
                    "Exploratory Data Analysis with Pandas & Seaborn",
                    "Linear and Logistic Regression Models",
                    "Decision Trees, Random Forests, & XGBoost",
                    "Unsupervised Clustering (K-Means, PCA)",
                    "Model Evaluation Metrics & Cross-Validation"
                ]
            },
            {
                title: "Cloud Computing & Kubernetes Architecture",
                code: "CLD401",
                description: "Containerization with Docker, microservices orchestration using Kubernetes, CI/CD automated pipelines, and cloud native infrastructure.",
                instructor: "Eng. Kelsey Hightower",
                category: "Cloud & DevOps",
                credits: 3,
                capacity: 30,
                enrolledCount: 0,
                schedule: "Tue / Thu 04:00 PM - 05:30 PM",
                syllabus: [
                    "Docker Containers & Multi-stage Builds",
                    "Kubernetes Pods, Services, & Ingress Controllers",
                    "Infrastructure as Code (Terraform)",
                    "Continuous Integration / Continuous Deployment",
                    "Cloud Security & Observability (Prometheus, Grafana)"
                ]
            },
            {
                title: "Network Security & Cryptographic Protocols",
                code: "SEC303",
                description: "Deep dive into symmetric and asymmetric cryptography, TLS/SSL protocols, authentication handshakes, vulnerability auditing, and defensive tactics.",
                instructor: "Dr. Bruce Schneier",
                category: "Cybersecurity",
                credits: 3,
                capacity: 40,
                enrolledCount: 0,
                schedule: "Mon / Thu 01:00 PM - 02:30 PM",
                syllabus: [
                    "Classical and Modern Cryptography (AES, RSA)",
                    "Hashing, Message Digest, & Digital Signatures",
                    "TLS/SSL Handshake & HTTPS Security",
                    "Web Application Security & OWASP Top 10",
                    "Network Penetration Testing & Defensive Hardening"
                ]
            }
        ]);

        console.log("Seeding Enrollments...");
        // Aarav enrolled in CS101 and CS204
        await Enrollment.create({
            student: student1._id,
            course: courses[0]._id,
            status: "enrolled",
            grade: "A"
        });

        await Enrollment.create({
            student: student1._id,
            course: courses[1]._id,
            status: "enrolled",
            grade: "In Progress"
        });

        // Priya enrolled in CS204 and AI301
        await Enrollment.create({
            student: student2._id,
            course: courses[1]._id,
            status: "enrolled",
            grade: "O"
        });

        await Enrollment.create({
            student: student2._id,
            course: courses[2]._id,
            status: "enrolled",
            grade: "In Progress"
        });

        console.log("=========================================");
        console.log(" Database Seeded Successfully!          ");
        console.log(" Default Credentials:                   ");
        console.log(" Admin:   admin@college.edu / admin123   ");
        console.log(" Student: aarav@student.edu / student123 ");
        console.log(" Student: priya@student.edu / student123 ");
        console.log("=========================================");

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
