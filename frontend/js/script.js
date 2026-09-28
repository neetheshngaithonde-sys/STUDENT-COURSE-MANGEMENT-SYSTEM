"use strict";

/* =========================================================
   EduPulse - Student Course Management System
   Frontend JavaScript
   ========================================================= */

const API_BASE = "/api";

/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
    token: localStorage.getItem("edupulse_token") || null,

    user: (() => {
        try {
            return JSON.parse(
                localStorage.getItem("edupulse_user") || "null"
            );
        } catch {
            return null;
        }
    })(),

    courses: [],
    myEnrollments: [],
    adminStudents: [],
    adminEnrollments: [],

    activeTab: "catalog",
    activeCategory: "All",
    searchQuery: "",
    sortBy: "default",
    adminSubtab: "courses"
};


/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "info") {
    let container = $("toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";

        Object.assign(container.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "99999",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.textContent = message;

    Object.assign(toast.style, {
        padding: "12px 18px",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
        maxWidth: "350px",
        background:
            type === "success"
                ? "#16a34a"
                : type === "error"
                    ? "#dc2626"
                    : type === "warning"
                        ? "#d97706"
                        : "#2563eb"
    });

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


/* =========================================================
   MODAL HELPERS
   ========================================================= */

function setModalVisible(modalId, visible) {
    const modal = $(modalId);

    if (!modal) {
        return;
    }

    if (visible) {
        modal.classList.add("active");
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    } else {
        modal.classList.remove("active");
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }

    if (options.body !== undefined) {
        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message =
                typeof data === "object"
                    ? data.message ||
                      data.error ||
                      "Request failed"
                    : data || "Request failed";

            throw new Error(message);
        }

        return data;

    } catch (error) {
        console.error("API Error:", endpoint, error);
        throw error;
    }
}


/* =========================================================
   SESSION
   ========================================================= */

function saveSession(token, user) {
    state.token = token;
    state.user = user;

    if (token) {
        localStorage.setItem("edupulse_token", token);
    }

    if (user) {
        localStorage.setItem(
            "edupulse_user",
            JSON.stringify(user)
        );
    }
}


function clearSession() {
    state.token = null;
    state.user = null;

    state.courses = [];
    state.myEnrollments = [];
    state.adminStudents = [];
    state.adminEnrollments = [];

    localStorage.removeItem("edupulse_token");
    localStorage.removeItem("edupulse_user");
}


function isLoggedIn() {
    return Boolean(state.token && state.user);
}


function isAdmin() {
    if (!state.user) {
        return false;
    }

    return (
        state.user.role === "admin" ||
        state.user.role === "ADMIN"
    );
}


/* =========================================================
   AUTH UI
   ========================================================= */

function updateAuthUI() {
    const guest = $("auth-guest");
    const userArea = $("auth-user");

    if (guest) {
        guest.style.display = isLoggedIn() ? "none" : "";
    }

    if (userArea) {
        userArea.style.display = isLoggedIn() ? "" : "none";
    }

    const nameElement = $("user-display-name");
    const avatarElement = $("user-avatar");
    const roleElement = $("user-role-badge");

    if (state.user) {
        const name =
            state.user.name ||
            state.user.username ||
            state.user.email ||
            "User";

        if (nameElement) {
            nameElement.textContent = name;
        }

        if (avatarElement) {
            avatarElement.textContent =
                name.charAt(0).toUpperCase();
        }

        if (roleElement) {
            roleElement.textContent =
                state.user.role || "Student";
        }
    }

    const adminTab = $("nav-tab-admin");

    if (adminTab) {
        adminTab.style.display = isAdmin() ? "" : "none";
    }

    const addCourseButton = $("btn-add-course-top");

    if (addCourseButton) {
        addCourseButton.style.display =
            isAdmin() ? "" : "none";
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(event) {
    if (event) {
        event.preventDefault();
    }

    const emailInput = $("login-email");
    const passwordInput = $("login-password");

    if (!emailInput || !passwordInput) {
        showToast("Login form not found.", "error");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast(
            "Please enter email and password.",
            "warning"
        );
        return;
    }

    try {
        const result = await apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: {
                    email,
                    password
                }
            }
        );

        const token =
            result.token ||
            result.accessToken ||
            result.access_token;

        const user =
            result.user ||
            result.data?.user ||
            null;

        if (!token) {
            throw new Error(
                "Login successful but no token was returned."
            );
        }

        saveSession(token, user);
        updateAuthUI();

        setModalVisible("modal-auth", false);

        showToast(
            "Login successful!",
            "success"
        );

        await loadAllData();

    } catch (error) {
        showToast(
            error.message || "Login failed.",
            "error"
        );
    }
}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser(event) {
    if (event) {
        event.preventDefault();
    }

    const nameInput = $("reg-name");
    const emailInput = $("reg-email");
    const passwordInput = $("reg-password");
    const roleInput = $("reg-role");

    if (
        !nameInput ||
        !emailInput ||
        !passwordInput
    ) {
        showToast(
            "Registration form not found.",
            "error"
        );
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput ? roleInput.value : "student";

    if (!name || !email || !password) {
        showToast(
            "Please fill all fields.",
            "warning"
        );
        return;
    }

    if (password.length < 6) {
        showToast(
            "Password must contain at least 6 characters.",
            "warning"
        );
        return;
    }

    const body = {
        name,
        email,
        password,
        role
    };

    const dept = $("reg-dept");
    const sem = $("reg-sem");

    if (dept) {
        body.department = dept.value.trim();
    }

    if (sem) {
        body.semester = sem.value;
    }

    try {
        const result = await apiRequest(
            "/auth/register",
            {
                method: "POST",
                body
            }
        );

        const token =
            result.token ||
            result.accessToken ||
            result.access_token;

        const user =
            result.user ||
            result.data?.user ||
            null;

        if (token) {
            saveSession(token, user);
            updateAuthUI();

            setModalVisible("modal-auth", false);

            showToast(
                "Registration successful!",
                "success"
            );

            await loadAllData();

        } else {
            showToast(
                "Registration successful. Please login.",
                "success"
            );

            switchAuthTab("login");
        }

    } catch (error) {
        showToast(
            error.message || "Registration failed.",
            "error"
        );
    }
}


/* =========================================================
   DEMO LOGIN
   ========================================================= */

async function demoLogin(role = "student") {
    try {
        const email =
            role === "admin"
                ? "admin@edupulse.com"
                : "student@edupulse.com";

        const password = "password";

        const result = await apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: {
                    email,
                    password
                }
            }
        );

        const token =
            result.token ||
            result.accessToken ||
            result.access_token;

        const user =
            result.user ||
            result.data?.user ||
            null;

        if (!token) {
            throw new Error(
                "Demo login did not return a token."
            );
        }

        saveSession(token, user);
        updateAuthUI();

        setModalVisible("modal-auth", false);

        showToast(
            `Logged in as ${role}.`,
            "success"
        );

        await loadAllData();

    } catch (error) {
        showToast(
            error.message ||
            "Demo login failed.",
            "error"
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {
    clearSession();

    updateAuthUI();

    state.activeTab = "catalog";

    showToast(
        "You have been logged out.",
        "success"
    );

    renderCourses();
    renderDashboard();
    showTab("catalog");
}


/* =========================================================
   VERIFY SESSION
   ========================================================= */

async function verifySession() {
    if (!state.token) {
        updateAuthUI();
        return false;
    }

    try {
        const result = await apiRequest(
            "/auth/me"
        );

        state.user =
            result.user ||
            result.data?.user ||
            result;

        localStorage.setItem(
            "edupulse_user",
            JSON.stringify(state.user)
        );

        updateAuthUI();

        return true;

    } catch (error) {
        console.warn(
            "Session verification failed."
        );

        clearSession();
        updateAuthUI();

        return false;
    }
}


/* =========================================================
   AUTH MODAL
   ========================================================= */

function openLoginModal() {
    setModalVisible("modal-auth", true);
    switchAuthTab("login");
}


function openRegisterModal() {
    setModalVisible("modal-auth", true);
    switchAuthTab("register");
}


function closeAuthModal() {
    setModalVisible("modal-auth", false);
}


function switchAuthTab(tab) {
    const loginForm = $("form-login");
    const registerForm = $("form-register");

    const loginTab = $("tab-btn-login");
    const registerTab = $("tab-btn-register");

    if (tab === "register") {
        if (loginForm) {
            loginForm.style.display = "none";
            loginForm.classList.remove("active");
        }

        if (registerForm) {
            registerForm.style.display = "";
            registerForm.classList.add("active");
        }

        if (loginTab) {
            loginTab.classList.remove("active");
        }

        if (registerTab) {
            registerTab.classList.add("active");
        }

    } else {
        if (registerForm) {
            registerForm.style.display = "none";
            registerForm.classList.remove("active");
        }

        if (loginForm) {
            loginForm.style.display = "";
            loginForm.classList.add("active");
        }

        if (registerTab) {
            registerTab.classList.remove("active");
        }

        if (loginTab) {
            loginTab.classList.add("active");
        }
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showTab(tabName) {
    state.activeTab = tabName;

    document.querySelectorAll(".tab-content").forEach(section => {
        section.classList.remove("active");
        section.style.display = "none";
    });

    const target = $(`tab-${tabName}`);

    if (target) {
        target.classList.add("active");
        target.style.display = "";
    }

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.remove("active");
    });

    const navButton = $(`nav-tab-${tabName}`);

    if (navButton) {
        navButton.classList.add("active");
    }

    if (tabName === "dashboard") {
        renderDashboard();
    }

    if (tabName === "admin") {
        if (!isAdmin()) {
            showToast(
                "Administrator access required.",
                "warning"
            );

            showTab("catalog");
            return;
        }

        loadAdminData();
    }
}


/* =========================================================
   COURSES
   ========================================================= */

async function loadCourses() {
    try {
        const result = await apiRequest("/courses");

        state.courses =
            Array.isArray(result)
                ? result
                : result.courses ||
                  result.data ||
                  [];

        renderCourses();

    } catch (error) {
        console.error(
            "Unable to load courses:",
            error
        );

        state.courses = [];

        renderCourses();

        showToast(
            error.message ||
            "Unable to load courses.",
            "error"
        );
    }
}


function getCourseId(course) {
    return (
        course._id ||
        course.id ||
        course.courseId
    );
}


function getCourseTitle(course) {
    return (
        course.title ||
        course.name ||
        "Untitled Course"
    );
}


function getCourseCategory(course) {
    return (
        course.category ||
        course.department ||
        "General"
    );
}


function getCourseCredits(course) {
    return (
        course.credits ||
        course.credit ||
        0
    );
}


function getCourseInstructor(course) {
    return (
        course.instructor ||
        course.instructorName ||
        "TBA"
    );
}


function renderCourses() {
    const grid = $("courses-grid");
    const empty = $("courses-empty");

    if (!grid) {
        return;
    }

    const loading = $("courses-loading");

    if (loading) {
        loading.remove();
    }

    let courses = [...state.courses];

    if (state.activeCategory !== "All") {
        courses = courses.filter(course =>
            getCourseCategory(course) ===
            state.activeCategory
        );
    }

    if (state.searchQuery) {
        const query =
            state.searchQuery.toLowerCase();

        courses = courses.filter(course => {
            const text = [
                getCourseTitle(course),
                course.code,
                getCourseInstructor(course),
                getCourseCategory(course),
                course.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(query);
        });
    }

    switch (state.sortBy) {
        case "title_asc":
            courses.sort((a, b) =>
                getCourseTitle(a)
                    .localeCompare(
                        getCourseTitle(b)
                    )
            );
            break;

        case "credits_desc":
            courses.sort((a, b) =>
                Number(getCourseCredits(b)) -
                Number(getCourseCredits(a))
            );
            break;

        case "credits_asc":
            courses.sort((a, b) =>
                Number(getCourseCredits(a)) -
                Number(getCourseCredits(b))
            );
            break;

        case "popular":
            courses.sort((a, b) =>
                Number(
                    b.enrollmentCount ||
                    b.enrolledCount ||
                    0
                ) -
                Number(
                    a.enrollmentCount ||
                    a.enrolledCount ||
                    0
                )
            );
            break;
    }

    if (courses.length === 0) {
        grid.innerHTML = "";

        if (empty) {
            empty.style.display = "";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    grid.innerHTML = courses.map(course => {
        const id = getCourseId(course);

        return `
            <article class="course-card">
                <div class="course-card-header">
                    <span class="course-category">
                        ${escapeHTML(getCourseCategory(course))}
                    </span>
                    <span class="course-code">
                        ${escapeHTML(course.code || "")}
                    </span>
                </div>

                <div class="course-card-body">
                    <h3>
                        ${escapeHTML(getCourseTitle(course))}
                    </h3>

                    <p>
                        ${escapeHTML(
                            course.description ||
                            "Explore this course and begin your academic journey."
                        )}
                    </p>

                    <div class="course-meta">
                        <span>
                            Instructor:
                            ${escapeHTML(getCourseInstructor(course))}
                        </span>

                        <span>
                            ${escapeHTML(getCourseCredits(course))}
                            Credits
                        </span>
                    </div>
                </div>

                <div class="course-card-actions">
                    <button
                        class="btn btn-outline btn-sm"
                        data-action="view-course"
                        data-id="${escapeHTML(id)}">
                        View Details
                    </button>

                    ${
                        isLoggedIn()
                            ? `
                                <button
                                    class="btn btn-primary btn-sm"
                                    data-action="enroll-course"
                                    data-id="${escapeHTML(id)}">
                                    Enroll
                                </button>
                              `
                            : `
                                <button
                                    class="btn btn-primary btn-sm"
                                    data-action="login-to-enroll">
                                    Sign In to Enroll
                                </button>
                              `
                    }
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   COURSE DETAILS
   ========================================================= */

function openCourseDetails(courseId) {
    const course = state.courses.find(
        item =>
            String(getCourseId(item)) ===
            String(courseId)
    );

    if (!course) {
        showToast(
            "Course not found.",
            "error"
        );
        return;
    }

    const content = $("course-details-content");

    if (!content) {
        return;
    }

    content.innerHTML = `
        <div class="course-details">
            <span class="course-category">
                ${escapeHTML(getCourseCategory(course))}
            </span>

            <h2>
                ${escapeHTML(getCourseTitle(course))}
            </h2>

            <p>
                ${escapeHTML(
                    course.description ||
                    "No description available."
                )}
            </p>

            <div class="course-details-meta">
                <p>
                    <strong>Course Code:</strong>
                    ${escapeHTML(course.code || "N/A")}
                </p>

                <p>
                    <strong>Instructor:</strong>
                    ${escapeHTML(getCourseInstructor(course))}
                </p>

                <p>
                    <strong>Credits:</strong>
                    ${escapeHTML(getCourseCredits(course))}
                </p>

                <p>
                    <strong>Schedule:</strong>
                    ${escapeHTML(course.schedule || "TBA")}
                </p>

                <p>
                    <strong>Capacity:</strong>
                    ${escapeHTML(course.capacity || "N/A")}
                </p>
            </div>

            ${
                course.syllabus
                    ? `
                        <div class="course-syllabus">
                            <h3>Syllabus</h3>
                            <p>
                                ${escapeHTML(
                                    Array.isArray(course.syllabus)
                                        ? course.syllabus.join(", ")
                                        : course.syllabus
                                )}
                            </p>
                        </div>
                      `
                    : ""
            }

            ${
                isLoggedIn()
                    ? `
                        <button
                            class="btn btn-primary"
                            id="details-enroll-btn"
                            data-id="${escapeHTML(
                                getCourseId(course)
                            )}">
                            Enroll in Course
                        </button>
                      `
                    : `
                        <button
                            class="btn btn-primary"
                            id="details-login-btn">
                            Sign In to Enroll
                        </button>
                      `
            }
        </div>
    `;

    setModalVisible(
        "modal-course-details",
        true
    );

    const enrollButton =
        $("details-enroll-btn");

    if (enrollButton) {
        enrollButton.addEventListener(
            "click",
            () => enrollCourse(courseId)
        );
    }

    const loginButton =
        $("details-login-btn");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            () => {
                setModalVisible(
                    "modal-course-details",
                    false
                );

                openLoginModal();
            }
        );
    }
}


/* =========================================================
   ENROLLMENT
   ========================================================= */

async function enrollCourse(courseId) {
    if (!isLoggedIn()) {
        openLoginModal();
        return;
    }

    try {
        await apiRequest(
            "/enrollments",
            {
                method: "POST",
                body: {
                    courseId
                }
            }
        );

        showToast(
            "Successfully enrolled in the course.",
            "success"
        );

        await loadAllData();

    } catch (error) {
        showToast(
            error.message ||
            "Unable to enroll in course.",
            "error"
        );
    }
}


/* =========================================================
   MY ENROLLMENTS
   ========================================================= */

async function loadMyEnrollments() {
    if (!isLoggedIn()) {
        state.myEnrollments = [];
        renderDashboard();
        return;
    }

    try {
        const result =
            await apiRequest("/enrollments/my");

        state.myEnrollments =
            Array.isArray(result)
                ? result
                : result.enrollments ||
                  result.data ||
                  [];

        renderDashboard();

        const badge =
            $("enrolled-badge");

        if (badge) {
            badge.textContent =
                state.myEnrollments.length;
        }

    } catch (error) {
        console.error(
            "Unable to load enrollments:",
            error
        );

        state.myEnrollments = [];

        renderDashboard();
    }
}


function renderDashboard() {
    const grid = $("dashboard-grid");
    const empty = $("dashboard-empty");
    const guest = $("dashboard-guest-prompt");

    if (!grid) {
        return;
    }

    if (!isLoggedIn()) {
        grid.innerHTML = "";

        if (empty) {
            empty.style.display = "none";
        }

        if (guest) {
            guest.style.display = "";
        }

        return;
    }

    if (guest) {
        guest.style.display = "none";
    }

    if (state.myEnrollments.length === 0) {
        grid.innerHTML = "";

        if (empty) {
            empty.style.display = "";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    grid.innerHTML =
        state.myEnrollments.map(enrollment => {
            const course =
                enrollment.course ||
                enrollment.courseId ||
                {};

            const title =
                course.title ||
                enrollment.courseTitle ||
                "Course";

            const status =
                enrollment.status ||
                "enrolled";

            const grade =
                enrollment.grade ||
                "In Progress";

            return `
                <article class="enrollment-card">
                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        Status:
                        <strong>
                            ${escapeHTML(status)}
                        </strong>
                    </p>

                    <p>
                        Grade:
                        <strong>
                            ${escapeHTML(grade)}
                        </strong>
                    </p>
                </article>
            `;
        }).join("");
}


/* =========================================================
   ADMIN
   ========================================================= */

async function loadAdminData() {
    if (!isAdmin()) {
        return;
    }

    try {
        await Promise.all([
            loadAdminCourses(),
            loadAdminStudents(),
            loadAdminEnrollments()
        ]);
    } catch (error) {
        console.error(
            "Admin data loading error:",
            error
        );
    }
}


async function loadAdminCourses() {
    try {
        const result =
            await apiRequest("/courses");

        state.courses =
            Array.isArray(result)
                ? result
                : result.courses ||
                  result.data ||
                  [];

        renderAdminCourses();

        renderCourses();

    } catch (error) {
        console.error(error);
    }
}


async function loadAdminStudents() {
    try {
        const result =
            await apiRequest("/users");

        state.adminStudents =
            Array.isArray(result)
                ? result
                : result.users ||
                  result.students ||
                  result.data ||
                  [];

        renderAdminStudents();

    } catch (error) {
        console.error(
            "Unable to load students:",
            error
        );
    }
}


async function loadAdminEnrollments() {
    try {
        const result =
            await apiRequest("/enrollments");

        state.adminEnrollments =
            Array.isArray(result)
                ? result
                : result.enrollments ||
                  result.data ||
                  [];

        renderAdminEnrollments();

    } catch (error) {
        console.error(
            "Unable to load admin enrollments:",
            error
        );
    }
}


/* =========================================================
   ADMIN COURSES TABLE
   ========================================================= */

function renderAdminCourses() {
    const tbody = $("tbody-courses");

    if (!tbody) {
        return;
    }

    if (state.courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No courses found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        state.courses.map(course => {
            const id =
                getCourseId(course);

            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            course.code || "-"
                        )}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(
                                getCourseTitle(course)
                            )}
                        </strong>
                        <br>
                        <small>
                            ${escapeHTML(
                                getCourseCategory(course)
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapeHTML(
                            getCourseInstructor(course)
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            getCourseCredits(course)
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            course.capacity || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            course.schedule || "TBA"
                        )}
                    </td>

                    <td class="text-right">
                        <button
                            class="btn btn-sm btn-outline"
                            data-action="edit-course"
                            data-id="${escapeHTML(id)}">
                            Edit
                        </button>

                        <button
                            class="btn btn-sm btn-ghost"
                            data-action="delete-course"
                            data-id="${escapeHTML(id)}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}


/* =========================================================
   ADMIN STUDENTS TABLE
   ========================================================= */

function renderAdminStudents() {
    const tbody = $("tbody-students");

    if (!tbody) {
        return;
    }

    if (state.adminStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No students found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        state.adminStudents.map(student => {
            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            student.studentId ||
                            student._id ||
                            student.id ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.name ||
                            student.username ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.email || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.department ||
                            student.dept ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.semester || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.phone || "-"
                        )}
                    </td>

                    <td class="text-right">
                        -
                    </td>
                </tr>
            `;
        }).join("");
}


/* =========================================================
   ADMIN ENROLLMENTS TABLE
   ========================================================= */

function renderAdminEnrollments() {
    const tbody = $("tbody-enrollments");

    if (!tbody) {
        return;
    }

    if (state.adminEnrollments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No enrollments found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        state.adminEnrollments.map(enrollment => {
            const id =
                enrollment._id ||
                enrollment.id;

            const student =
                enrollment.student ||
                {};

            const course =
                enrollment.course ||
                {};

            return `
                <tr>
                    <td>
                        ${escapeHTML(
                            student.name ||
                            enrollment.studentName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            course.title ||
                            enrollment.courseTitle ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            enrollment.createdAt ||
                            enrollment.enrolledAt ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            enrollment.grade ||
                            "In Progress"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            enrollment.status ||
                            "enrolled"
                        )}
                    </td>

                    <td class="text-right">
                        <button
                            class="btn btn-sm btn-outline"
                            data-action="edit-enrollment"
                            data-id="${escapeHTML(id)}">
                            Update
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}


/* =========================================================
   COURSE FORM
   ========================================================= */

function openCourseForm(course = null) {
    if (!isAdmin()) {
        showToast(
            "Administrator access required.",
            "warning"
        );
        return;
    }

    setModalVisible(
        "modal-course-form",
        true
    );

    $("course-form-title").textContent =
        course
            ? "Edit Course"
            : "Add New Course";

    $("course-form-id").value =
        course
            ? getCourseId(course)
            : "";

    $("cf-title").value =
        course?.title ||
        course?.name ||
        "";

    $("cf-code").value =
        course?.code ||
        "";

    $("cf-description").value =
        course?.description ||
        "";

    $("cf-instructor").value =
        course?.instructor ||
        course?.instructorName ||
        "";

    $("cf-category").value =
        course?.category ||
        "Computer Science";

    $("cf-credits").value =
        course?.credits ||
        4;

    $("cf-capacity").value =
        course?.capacity ||
        40;

    $("cf-schedule").value =
        course?.schedule ||
        "";

    $("cf-syllabus").value =
        Array.isArray(course?.syllabus)
            ? course.syllabus.join(", ")
            : course?.syllabus ||
              "";
}


function closeCourseForm() {
    setModalVisible(
        "modal-course-form",
        false
    );
}


async function saveCourse(event) {
    if (event) {
        event.preventDefault();
    }

    if (!isAdmin()) {
        showToast(
            "Administrator access required.",
            "warning"
        );
        return;
    }

    const id =
        $("course-form-id")?.value;

    const body = {
        title: $("cf-title")?.value.trim(),
        code: $("cf-code")?.value.trim(),
        description:
            $("cf-description")?.value.trim(),
        instructor:
            $("cf-instructor")?.value.trim(),
        category:
            $("cf-category")?.value,
        credits:
            Number($("cf-credits")?.value || 4),
        capacity:
            Number($("cf-capacity")?.value || 40),
        schedule:
            $("cf-schedule")?.value.trim(),
        syllabus:
            $("cf-syllabus")?.value
                .split(",")
                .map(item => item.trim())
                .filter(Boolean)
    };

    if (!body.title || !body.code) {
        showToast(
            "Course title and code are required.",
            "warning"
        );
        return;
    }

    try {
        if (id) {
            await apiRequest(
                `/courses/${encodeURIComponent(id)}`,
                {
                    method: "PUT",
                    body
                }
            );

            showToast(
                "Course updated successfully.",
                "success"
            );

        } else {
            await apiRequest(
                "/courses",
                {
                    method: "POST",
                    body
                }
            );

            showToast(
                "Course created successfully.",
                "success"
            );
        }

        closeCourseForm();

        await loadAllData();

        if (isAdmin()) {
            await loadAdminData();
        }

    } catch (error) {
        showToast(
            error.message ||
            "Unable to save course.",
            "error"
        );
    }
}


async function deleteCourse(courseId) {
    if (!isAdmin()) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this course?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            `/courses/${encodeURIComponent(courseId)}`,
            {
                method: "DELETE"
            }
        );

        showToast(
            "Course deleted successfully.",
            "success"
        );

        await loadAllData();
        await loadAdminData();

    } catch (error) {
        showToast(
            error.message ||
            "Unable to delete course.",
            "error"
        );
    }
}


/* =========================================================
   ADMIN SUBTABS
   ========================================================= */

function showAdminSubtab(subtab) {
    state.adminSubtab = subtab;

    document
        .querySelectorAll(".admin-subcontent")
        .forEach(element => {
            element.classList.remove("active");
            element.style.display = "none";
        });

    const target =
        $(`subtab-${subtab}`);

    if (target) {
        target.classList.add("active");
        target.style.display = "";
    }

    document
        .querySelectorAll(".admin-nav-btn")
        .forEach(button => {
            button.classList.remove("active");

            if (
                button.dataset.subtab ===
                subtab
            ) {
                button.classList.add("active");
            }
        });
}


/* =========================================================
   ENROLLMENT EDIT MODAL
   ========================================================= */

function openEnrollmentEdit(enrollmentId) {
    const enrollment =
        state.adminEnrollments.find(
            item =>
                String(
                    item._id || item.id
                ) === String(enrollmentId)
        );

    if (!enrollment) {
        showToast(
            "Enrollment not found.",
            "error"
        );
        return;
    }

    $("edit-enrollment-id").value =
        enrollmentId;

    $("edit-enrollment-status").value =
        enrollment.status ||
        "enrolled";

    $("edit-enrollment-grade").value =
        enrollment.grade ||
        "";

    $("enrollment-edit-meta").textContent =
        `Update record for ${
            enrollment.student?.name ||
            enrollment.studentName ||
            "student"
        }`;

    setModalVisible(
        "modal-enrollment-edit",
        true
    );
}


function closeEnrollmentEdit() {
    setModalVisible(
        "modal-enrollment-edit",
        false
    );
}


async function saveEnrollmentEdit(event) {
    if (event) {
        event.preventDefault();
    }

    const id =
        $("edit-enrollment-id")?.value;

    if (!id) {
        return;
    }

    const body = {
        status:
            $("edit-enrollment-status")?.value,
        grade:
            $("edit-enrollment-grade")?.value.trim()
    };

    try {
        await apiRequest(
            `/enrollments/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                body
            }
        );

        showToast(
            "Enrollment updated successfully.",
            "success"
        );

        closeEnrollmentEdit();

        await loadAdminEnrollments();

    } catch (error) {
        showToast(
            error.message ||
            "Unable to update enrollment.",
            "error"
        );
    }
}


/* =========================================================
   SEARCH AND FILTERS
   ========================================================= */

function handleCourseSearch(event) {
    state.searchQuery =
        event.target.value.trim();

    const clearButton =
        $("btn-clear-search");

    if (clearButton) {
        clearButton.style.display =
            state.searchQuery
                ? ""
                : "none";
    }

    renderCourses();
}


function clearCourseSearch() {
    state.searchQuery = "";

    const input =
        $("course-search-input");

    if (input) {
        input.value = "";
    }

    const clearButton =
        $("btn-clear-search");

    if (clearButton) {
        clearButton.style.display = "none";
    }

    renderCourses();
}


function resetFilters() {
    state.activeCategory = "All";
    state.searchQuery = "";
    state.sortBy = "default";

    const search =
        $("course-search-input");

    if (search) {
        search.value = "";
    }

    const sort =
        $("sort-select");

    if (sort) {
        sort.value = "default";
    }

    document
        .querySelectorAll(".category-pill")
        .forEach(button => {
            button.classList.remove("active");

            if (
                button.dataset.category ===
                "All"
            ) {
                button.classList.add("active");
            }
        });

    renderCourses();
}


function handleCategoryClick(button) {
    state.activeCategory =
        button.dataset.category ||
        "All";

    document
        .querySelectorAll(".category-pill")
        .forEach(item => {
            item.classList.remove("active");
        });

    button.classList.add("active");

    renderCourses();
}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadAllData() {
    await loadCourses();

    if (isLoggedIn()) {
        await loadMyEnrollments();
    } else {
        state.myEnrollments = [];
        renderDashboard();
    }

    updateAuthUI();

    if (isAdmin()) {
        await loadAdminData();
    }
}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function setupDynamicEvents() {

    document.addEventListener(
        "click",
        event => {

            const actionElement =
                event.target.closest(
                    "[data-action]"
                );

            if (!actionElement) {
                return;
            }

            const action =
                actionElement.dataset.action;

            const id =
                actionElement.dataset.id;

            if (action === "view-course") {
                openCourseDetails(id);
            }

            if (action === "enroll-course") {
                enrollCourse(id);
            }

            if (action === "login-to-enroll") {
                openLoginModal();
            }

            if (action === "edit-course") {
                const course =
                    state.courses.find(
                        item =>
                            String(
                                getCourseId(item)
                            ) === String(id)
                    );

                if (course) {
                    openCourseForm(course);
                }
            }

            if (action === "delete-course") {
                deleteCourse(id);
            }

            if (action === "edit-enrollment") {
                openEnrollmentEdit(id);
            }
        }
    );
}


/* =========================================================
   STATIC EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    /* Navigation */

    $("nav-tab-catalog")
        ?.addEventListener(
            "click",
            () => showTab("catalog")
        );

    $("nav-tab-dashboard")
        ?.addEventListener(
            "click",
            () => showTab("dashboard")
        );

    $("nav-tab-admin")
        ?.addEventListener(
            "click",
            () => showTab("admin")
        );


    /* Authentication */

    $("btn-open-login")
        ?.addEventListener(
            "click",
            openLoginModal
        );

    $("btn-open-register")
        ?.addEventListener(
            "click",
            openRegisterModal
        );

    $("btn-quick-demo")
        ?.addEventListener(
            "click",
            () => demoLogin("student")
        );

    $("btn-logout")
        ?.addEventListener(
            "click",
            logoutUser
        );

    $("btn-close-auth-modal")
        ?.addEventListener(
            "click",
            closeAuthModal
        );

    $("tab-btn-login")
        ?.addEventListener(
            "click",
            () => switchAuthTab("login")
        );

    $("tab-btn-register")
        ?.addEventListener(
            "click",
            () => switchAuthTab("register")
        );

    $("form-login")
        ?.addEventListener(
            "submit",
            loginUser
        );

    $("form-register")
        ?.addEventListener(
            "submit",
            registerUser
        );


    /* Demo Login */

    $("btn-demo-student-1")
        ?.addEventListener(
            "click",
            () => demoLogin("student")
        );

    $("btn-demo-student-2")
        ?.addEventListener(
            "click",
            () => demoLogin("student")
        );

    $("btn-demo-admin")
        ?.addEventListener(
            "click",
            () => demoLogin("admin")
        );


    /* Search */

    $("course-search-input")
        ?.addEventListener(
            "input",
            handleCourseSearch
        );

    $("btn-clear-search")
        ?.addEventListener(
            "click",
            clearCourseSearch
        );

    $("btn-reset-filters")
        ?.addEventListener(
            "click",
            resetFilters
        );


    /* Sort */

    $("sort-select")
        ?.addEventListener(
            "change",
            event => {
                state.sortBy =
                    event.target.value;

                renderCourses();
            }
        );


    /* Category buttons */

    document
        .querySelectorAll(".category-pill")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => handleCategoryClick(button)
            );
        });


    /* Dashboard */

    $("btn-browse-catalog-cta")
        ?.addEventListener(
            "click",
            () => showTab("catalog")
        );

    $("btn-dashboard-login")
        ?.addEventListener(
            "click",
            openLoginModal
        );

    $("btn-dashboard-demo-student")
        ?.addEventListener(
            "click",
            () => demoLogin("student")
        );


    /* Admin */

    $("btn-add-course-top")
        ?.addEventListener(
            "click",
            () => openCourseForm()
        );

    $("btn-admin-add-course")
        ?.addEventListener(
            "click",
            () => openCourseForm()
        );

    document
        .querySelectorAll(".admin-nav-btn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    showAdminSubtab(
                        button.dataset.subtab
                    );
                }
            );
        });


    /* Course form */

    $("btn-close-course-form")
        ?.addEventListener(
            "click",
            closeCourseForm
        );

    $("btn-cancel-course-form")
        ?.addEventListener(
            "click",
            closeCourseForm
        );

    $("form-manage-course")
        ?.addEventListener(
            "submit",
            saveCourse
        );


    /* Course details */

    $("btn-close-course-details")
        ?.addEventListener(
            "click",
            () =>
                setModalVisible(
                    "modal-course-details",
                    false
                )
        );


    /* Enrollment edit */

    $("btn-close-enrollment-edit")
        ?.addEventListener(
            "click",
            closeEnrollmentEdit
        );

    $("btn-cancel-enrollment-edit")
        ?.addEventListener(
            "click",
            closeEnrollmentEdit
        );

    $("form-edit-enrollment")
        ?.addEventListener(
            "submit",
            saveEnrollmentEdit
        );


    /* Registration role */

    $("reg-role")
        ?.addEventListener(
            "change",
            event => {
                const fields =
                    $("student-extra-fields");

                if (!fields) {
                    return;
                }

                fields.style.display =
                    event.target.value === "student"
                        ? ""
                        : "none";
            }
        );


    /* Close modal by clicking backdrop */

    document
        .querySelectorAll(".modal-backdrop")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {
                        modal.style.display =
                            "none";

                        modal.classList.remove(
                            "active"
                        );
                    }
                }
            );
        });


    /* Escape key */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            document
                .querySelectorAll(".modal-backdrop")
                .forEach(modal => {

                    modal.style.display =
                        "none";

                    modal.classList.remove(
                        "active"
                    );
                });
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeApp() {

    console.log(
        "LEARNPulse: JavaScript initialized successfully"
    );

    setupEventListeners();
    setupDynamicEvents();

    updateAuthUI();

    showTab("catalog");

    showAdminSubtab(
        "admin-courses"
    );

    await verifySession();

    await loadAllData();
}


/* =========================================================
   START APPLICATION
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}