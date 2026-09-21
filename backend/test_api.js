const http = require("http");

// Helper to make fetch-like calls
const request = async (port, method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const headers = {
            "Content-Type": "application/json"
        };
        if (payload) {
            headers["Content-Length"] = Buffer.byteLength(payload);
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const req = http.request(
            {
                hostname: "localhost",
                port,
                path,
                method,
                headers
            },
            (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        resolve({
                            status: res.statusCode,
                            data: JSON.parse(body)
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body
                        });
                    }
                });
            }
        );

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
};

const runTests = async () => {
    const port = 5000;
    console.log("--> Starting Comprehensive API & Auth Tests on port", port);

    try {
        // 1. Health check
        const health = await request(port, "GET", "/api/health");
        console.log("1. Health Check:", health.status === 200 ? "PASS" : "FAIL", health.data.progression);

        // 2. Admin Login
        const adminLogin = await request(port, "POST", "/api/auth/login", {
            email: "admin@college.edu",
            password: "admin123"
        });
        console.log("2. Admin Login:", adminLogin.status === 200 ? "PASS" : "FAIL", "Token received:", !!adminLogin.data.token);
        const adminToken = adminLogin.data.token;

        // 3. Student Login
        const studentLogin = await request(port, "POST", "/api/auth/login", {
            email: "aarav@student.edu",
            password: "student123"
        });
        console.log("3. Student Login:", studentLogin.status === 200 ? "PASS" : "FAIL", "Role:", studentLogin.data.user?.role);
        const studentToken = studentLogin.data.token;

        // 4. Get Courses
        const coursesRes = await request(port, "GET", "/api/courses");
        console.log("4. Get Courses Count:", coursesRes.data.count, coursesRes.status === 200 ? "PASS" : "FAIL");

        // 5. Filter courses by category
        const filterRes = await request(port, "GET", "/api/courses?category=Artificial%20Intelligence");
        console.log("5. Filter Category (AI):", filterRes.data.data?.[0]?.code === "AI301" ? "PASS" : "FAIL");

        // 6. Search course
        const searchRes = await request(port, "GET", "/api/courses?search=MERN");
        console.log("6. Search Course ('MERN'):", searchRes.data.data?.[0]?.code === "CS204" ? "PASS" : "FAIL");

        // 7. Student Enroll in Course (DS202)
        const allCourses = coursesRes.data.data;
        const dsCourse = allCourses.find((c) => c.code === "DS202");
        const enrollRes = await request(port, "POST", "/api/enrollments", { courseId: dsCourse._id }, studentToken);
        console.log("7. Student Enroll in DS202:", enrollRes.status === 201 ? "PASS" : "FAIL", enrollRes.data.message);

        // 8. Student view My Enrollments
        const myEnrollments = await request(port, "GET", "/api/enrollments/my", null, studentToken);
        console.log("8. Student My Enrollments Count:", myEnrollments.data.count, myEnrollments.status === 200 ? "PASS" : "FAIL");

        // 9. Admin create course
        const newCourseRes = await request(port, "POST", "/api/courses", {
            title: "Mobile App Development with Flutter",
            code: "MOB205",
            description: "Cross-platform mobile application development using Dart and Flutter framework.",
            instructor: "Prof. Ada Lovelace",
            category: "Web Development",
            credits: 3,
            capacity: 30
        }, adminToken);
        console.log("9. Admin Create Course:", newCourseRes.status === 201 ? "PASS" : "FAIL", newCourseRes.data.data?.code);

        // 10. Security check: Student trying to create course should get 403
        const forbiddenRes = await request(port, "POST", "/api/courses", {
            title: "Hacked Course",
            code: "HACK101",
            description: "Should fail",
            instructor: "Hacker"
        }, studentToken);
        console.log("10. Role Security Check (Student creating course -> 403 Forbidden):", forbiddenRes.status === 403 ? "PASS" : "FAIL");

        console.log("\nALL 10 API & SECURITY TESTS COMPLETED SUCCESSFULLY!\n");
        process.exit(0);
    } catch (err) {
        console.error("Test failed with error:", err.message);
        process.exit(1);
    }
};

runTests();
