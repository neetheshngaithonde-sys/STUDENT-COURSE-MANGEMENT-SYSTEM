/**
 * EduPulse - Student Course Management System
 * Frontend Client Application (Vanilla JavaScript)
 * Connected to REST API with JWT Auth, Role-Based Access, and Full CRUD
 */

// ==========================================
// Application State
// ==========================================
const state = {
    token: localStorage.getItem("edupulse_token") || null,
    user: JSON.parse(localStorage.getItem("edupulse_user") || "null"),
    courses: [],
    myEnrollments: [],
    adminStudents: [],
    adminEnrollments: [],
    activeTab: "catalog",
    activeCategory: "All",
    searchQuery: "",
    sortBy: "default",
    adminSubtab: "admin-courses"
};

// API Base URL (relative to the current host)
const API_BASE = "/api";

// ==========================================
// API Helper
// ==========================================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    initNavigation();
    initAuthUI();
    initFiltersAndSearch();
    initModals();
    initAdminControls();

    // Check if token exists, verify with server
    if (state.token) {
        await verifyUserSession();
    } else {
        updateAuthHeader();
    }

    // Initial Load
    await refreshAllData();
});

// ==========================================
// Session Verification
// ==========================================
async function verifyUserSession() {
    try {
        const res = await apiRequest("/auth/me");
        if (res.success && res.user) {
            state.user = res.user;
            localStorage.setItem("edupulse_user", JSON.stringify(res.user));
        }
    } catch (err) {
        console.warn("Session expired or invalid, logging out:", err.message);
        clearSession();
    }
    updateAuthHeader();
}

function setSession(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem("edupulse_token", token);
    localStorage.setItem("edupulse_user", JSON.stringify(user));
    updateAuthHeader();
}

function clearSession() {
    state.token = null;
    state.user = null;
    state.myEnrollments = [];
    localStorage.removeItem("edupulse_token");
    localStorage.removeItem("edupulse_user");
    updateAuthHeader();
}

function updateAuthHeader() {
    const guestBox = document.getElementById("auth-guest");
    const userBox = document.getElementById("auth-user");
    const adminNav = document.getElementById("nav-tab-admin");
    const addCourseBtnTop = document.getElementById("btn-add-course-top");

    if (state.user) {
        guestBox.style.display = "none";
        userBox.style.display = "flex";

        document.getElementById("user-display-name").textContent = state.user.name;
        const roleBadge = document.getElementById("user-role-badge");
        roleBadge.textContent = state.user.role;

        if (state.user.role === "admin") {
            roleBadge.classList.add("admin-role");
            adminNav.style.display = "inline-flex";
            if (addCourseBtnTop) addCourseBtnTop.style.display = "inline-flex";
        } else {
            roleBadge.classList.remove("admin-role");
            adminNav.style.display = "none";
            if (addCourseBtnTop) addCourseBtnTop.style.display = "none";
        }

        // Generate initials for avatar
        const initials = state.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        document.getElementById("user-avatar").textContent = initials;
    } else {
        guestBox.style.display = "flex";
        userBox.style.display = "none";
        adminNav.style.display = "none";
        if (addCourseBtnTop) addCourseBtnTop.style.display = "none";
    }

    updateEnrolledBadge();
}

function updateEnrolledBadge() {
    const badge = document.getElementById("enrolled-badge");
    if (!badge) return;
    const activeCount = state.myEnrollments.filter((e) => e.status === "enrolled").length;
    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? "inline-block" : "none";
}

// ==========================================
// Navigation & Tabs
// ==========================================
function initNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const tab = link.getAttribute("data-tab");
            switchTab(tab);
        });
    });

    // Logo click goes back to catalog
    document.getElementById("brand-logo").addEventListener("click", () => switchTab("catalog"));

    // CTA in empty dashboard
    const browseCta = document.getElementById("btn-browse-catalog-cta");
    if (browseCta) {
        browseCta.addEventListener("click", () => switchTab("catalog"));
    }
}

function switchTab(tabName) {
    state.activeTab = tabName;

    // Update nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
        if (link.getAttribute("data-tab") === tabName) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Update tab sections
    document.querySelectorAll(".tab-content").forEach((section) => {
        section.classList.remove("active");
    });
    const targetSection = document.getElementById(`tab-${tabName}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    if (tabName === "dashboard") {
        renderDashboardView();
    } else if (tabName === "admin") {
        renderAdminHub();
    }
}

// ==========================================
// Data Fetching & Sync
// ==========================================
async function refreshAllData() {
    await fetchStats();
    await fetchCourses();
    if (state.user && state.token) {
        if (state.user.role === "student") {
            await fetchMyEnrollments();
        } else if (state.user.role === "admin") {
            await fetchAdminData();
        }
    }
}

async function fetchStats() {
    try {
        const res = await apiRequest("/courses/stats/summary");
        if (res.success && res.data) {
            document.getElementById("stat-total-courses").textContent = res.data.totalCourses;
            document.getElementById("stat-total-enrollments").textContent = res.data.totalEnrollments;
            document.getElementById("stat-departments").textContent = res.data.categories?.length || 6;
        }
    } catch (e) {
        console.error("Failed to fetch stats:", e);
    }
}

async function fetchCourses() {
    const loadingEl = document.getElementById("courses-loading");
    const gridEl = document.getElementById("courses-grid");
    const emptyEl = document.getElementById("courses-empty");

    try {
        let queryParams = [];
        if (state.activeCategory && state.activeCategory !== "All") {
            queryParams.push(`category=${encodeURIComponent(state.activeCategory)}`);
        }
        if (state.searchQuery.trim()) {
            queryParams.push(`search=${encodeURIComponent(state.searchQuery.trim())}`);
        }
        if (state.sortBy && state.sortBy !== "default") {
            queryParams.push(`sort=${encodeURIComponent(state.sortBy)}`);
        }

        const url = `/courses${queryParams.length ? "?" + queryParams.join("&") : ""}`;
        const res = await apiRequest(url);

        if (res.success) {
            state.courses = res.data;
            renderCourses();
        }
    } catch (err) {
        showToast("Error loading courses: " + err.message, "error");
    } finally {
        if (loadingEl) loadingEl.style.display = "none";
    }
}

async function fetchMyEnrollments() {
    if (!state.token) return;
    try {
        const res = await apiRequest("/enrollments/my");
        if (res.success) {
            state.myEnrollments = res.data;
            updateEnrolledBadge();
            if (state.activeTab === "dashboard") {
                renderDashboardView();
            }
            // Re-render courses to update "Enrolled" button labels
            renderCourses();
        }
    } catch (err) {
        console.error("Failed to fetch enrollments:", err);
    }
}

// ==========================================
// Rendering: Course Catalog
// ==========================================
function renderCourses() {
    const gridEl = document.getElementById("courses-grid");
    const emptyEl = document.getElementById("courses-empty");

    gridEl.innerHTML = "";

    if (!state.courses || state.courses.length === 0) {
        emptyEl.style.display = "block";
        return;
    }

    emptyEl.style.display = "none";

    // Set of enrolled course IDs for the logged-in student
    const enrolledCourseIds = new Set(
        state.myEnrollments
            .filter((e) => e.status === "enrolled")
            .map((e) => (typeof e.course === "object" ? e.course._id : e.course))
    );

    state.courses.forEach((course) => {
        const isEnrolled = enrolledCourseIds.has(course._id);
        const isFull = course.enrolledCount >= course.capacity;
        const fillPercent = Math.min(100, Math.round((course.enrolledCount / course.capacity) * 100));

        const card = document.createElement("div");
        card.className = "course-card";
        card.innerHTML = `
            <div>
                <div class="course-card-header">
                    <span class="course-code-badge">${escapeHTML(course.code)}</span>
                    <span class="course-category-badge">${escapeHTML(course.category)}</span>
                </div>
                <h3 class="course-title">${escapeHTML(course.title)}</h3>
                <p class="course-desc">${escapeHTML(course.description)}</p>
                
                <div class="course-meta-row">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>${escapeHTML(course.instructor)}</span>
                </div>
                <div class="course-meta-row">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>${escapeHTML(course.schedule || "Flexible Hours")}</span>
                </div>

                <div class="course-capacity-box">
                    <div class="capacity-info">
                        <span>Capacity: ${course.enrolledCount} / ${course.capacity} Students</span>
                        <span>${fillPercent}%</span>
                    </div>
                    <div class="capacity-bar-track">
                        <div class="capacity-bar-fill ${isFull ? "full" : ""}" style="width: ${fillPercent}%"></div>
                    </div>
                </div>
            </div>

            <div class="course-card-footer">
                <div class="course-credits-tag">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>${course.credits} Credits</span>
                </div>

                <div class="course-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="openCourseDetailsModal('${course._id}')">
                        Syllabus
                    </button>
                    ${renderCourseActionButton(course, isEnrolled, isFull)}
                </div>
            </div>
        `;
        gridEl.appendChild(card);
    });
}

function renderCourseActionButton(course, isEnrolled, isFull) {
    if (!state.user) {
        return `<button class="btn btn-primary btn-sm" onclick="openAuthModal('login')">Sign In to Enroll</button>`;
    }

    if (state.user.role === "admin") {
        return `
            <button class="btn btn-outline btn-sm" onclick="openEditCourseModal('${course._id}')" title="Edit Course">
                ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteCourse('${course._id}')" title="Delete Course">
                🗑️
            </button>
        `;
    }

    // Student role
    if (isEnrolled) {
        return `<button class="btn btn-outline btn-sm" style="color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.4);" disabled>Enrolled ✓</button>`;
    }

    if (isFull) {
        return `<button class="btn btn-outline btn-sm" disabled style="color: var(--accent-rose);">Class Full</button>`;
    }

    return `<button class="btn btn-primary btn-sm" onclick="handleEnroll('${course._id}')">Enroll Now</button>`;
}

// ==========================================
// Enrollment Actions
// ==========================================
async function handleEnroll(courseId) {
    if (!state.user) {
        openAuthModal("login");
        return;
    }

    try {
        const res = await apiRequest("/enrollments", {
            method: "POST",
            body: JSON.stringify({ courseId })
        });

        if (res.success) {
            showToast(res.message || "Successfully enrolled!", "success");
            await fetchMyEnrollments();
            await fetchCourses();
            await fetchStats();
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleWithdraw(enrollmentId, courseTitle) {
    if (!confirm(`Are you sure you want to drop '${courseTitle}'?`)) return;

    try {
        const res = await apiRequest(`/enrollments/${enrollmentId}`, {
            method: "DELETE"
        });

        if (res.success) {
            showToast("Successfully withdrawn from the course", "info");
            await fetchMyEnrollments();
            await fetchCourses();
            await fetchStats();
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// Rendering: Student Dashboard
// ==========================================
function renderDashboardView() {
    const gridEl = document.getElementById("dashboard-grid");
    const emptyEl = document.getElementById("dashboard-empty");
    const guestPrompt = document.getElementById("dashboard-guest-prompt");
    const userInfoEl = document.getElementById("dashboard-user-info");

    gridEl.innerHTML = "";

    if (!state.user) {
        guestPrompt.style.display = "block";
        emptyEl.style.display = "none";
        if (userInfoEl) userInfoEl.innerHTML = "";
        return;
    }

    guestPrompt.style.display = "none";

    // User summary banner
    const profile = state.user.studentProfile || {};
    const totalCredits = state.myEnrollments
        .filter((e) => e.status === "enrolled" && e.course)
        .reduce((sum, e) => sum + (e.course.credits || 0), 0);

    userInfoEl.innerHTML = `
        <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHTML(state.user.name)}</div>
            <div style="font-size: 0.8rem; color: var(--accent-cyan);">${profile.studentId || "Student Account"} • ${profile.department || "Computer Science"}</div>
        </div>
        <div style="padding-left: 16px; border-left: 1px solid var(--border-subtle); text-align: center;">
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-emerald);">${totalCredits}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Active Credits</div>
        </div>
    `;

    if (!state.myEnrollments || state.myEnrollments.length === 0) {
        emptyEl.style.display = "block";
        return;
    }

    emptyEl.style.display = "none";

    state.myEnrollments.forEach((enrollment) => {
        const course = enrollment.course;
        if (!course) return;

        const enrollDate = new Date(enrollment.enrollmentDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const statusClass = `status-${enrollment.status}`;

        const card = document.createElement("div");
        card.className = "enrolled-card";
        card.innerHTML = `
            <div>
                <div class="course-card-header">
                    <span class="course-code-badge">${escapeHTML(course.code)}</span>
                    <span class="status-badge ${statusClass}">${escapeHTML(enrollment.status)}</span>
                </div>
                <h3 class="course-title">${escapeHTML(course.title)}</h3>
                <p class="course-desc">${escapeHTML(course.description)}</p>
                
                <div class="course-meta-row">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>${escapeHTML(course.instructor)}</span>
                </div>
                <div class="course-meta-row">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>${escapeHTML(course.schedule || "Standard Session")}</span>
                </div>
                <div class="course-meta-row">
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Enrolled on: ${enrollDate}</span>
                </div>
            </div>

            <div class="course-card-footer">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="course-credits-tag">${course.credits} Credits</span>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #fde047;">Grade: ${escapeHTML(enrollment.grade || "In Progress")}</span>
                </div>
                ${
                    enrollment.status === "enrolled"
                        ? `<button class="btn btn-danger btn-sm" onclick="handleWithdraw('${enrollment._id}', '${escapeHTML(course.title)}')">Drop Course</button>`
                        : `<span style="font-size: 0.8rem; color: var(--text-muted);">Completed/Dropped</span>`
                }
            </div>
        `;
        gridEl.appendChild(card);
    });
}

// ==========================================
// Rendering: Admin Hub
// ==========================================
async function renderAdminHub() {
    if (!state.user || state.user.role !== "admin") return;
    await fetchAdminData();
}

async function fetchAdminData() {
    try {
        // Fetch courses for admin table
        renderAdminCoursesTable();

        // Fetch registered students
        const studentsRes = await apiRequest("/students");
        if (studentsRes.success) {
            state.adminStudents = studentsRes.data;
            renderAdminStudentsTable();
        }

        // Fetch master enrollments
        const enrollmentsRes = await apiRequest("/enrollments");
        if (enrollmentsRes.success) {
            state.adminEnrollments = enrollmentsRes.data;
            renderAdminEnrollmentsTable();
        }
    } catch (err) {
        console.error("Admin data fetch error:", err);
    }
}

function renderAdminCoursesTable() {
    const tbody = document.getElementById("tbody-courses");
    if (!tbody) return;

    if (!state.courses || state.courses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No courses configured.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.courses
        .map(
            (c) => `
            <tr>
                <td><span class="course-code-badge">${escapeHTML(c.code)}</span></td>
                <td>
                    <div style="font-weight: 700; color: var(--text-primary);">${escapeHTML(c.title)}</div>
                    <div style="font-size: 0.76rem; color: var(--text-muted);">${escapeHTML(c.category)}</div>
                </td>
                <td>${escapeHTML(c.instructor)}</td>
                <td>${c.credits}</td>
                <td>
                    <span style="font-weight: 700; color: ${c.enrolledCount >= c.capacity ? "var(--accent-rose)" : "var(--accent-emerald)"};">
                        ${c.enrolledCount} / ${c.capacity}
                    </span>
                </td>
                <td>${escapeHTML(c.schedule || "N/A")}</td>
                <td class="text-right">
                    <button class="btn btn-outline btn-sm" onclick="openEditCourseModal('${c._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteCourse('${c._id}')">Delete</button>
                </td>
            </tr>
        `
        )
        .join("");
}

function renderAdminStudentsTable() {
    const tbody = document.getElementById("tbody-students");
    if (!tbody) return;

    if (!state.adminStudents || state.adminStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No registered students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.adminStudents
        .map(
            (s) => `
            <tr>
                <td><span class="course-code-badge">${escapeHTML(s.studentId)}</span></td>
                <td style="font-weight: 700; color: var(--text-primary);">${escapeHTML(s.user ? s.user.name : "N/A")}</td>
                <td>${escapeHTML(s.user ? s.user.email : "N/A")}</td>
                <td>${escapeHTML(s.department || "Computer Science")}</td>
                <td>Semester ${s.semester || 1}</td>
                <td>${escapeHTML(s.phone || "N/A")}</td>
                <td class="text-right">
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteStudent('${s._id}')">Remove</button>
                </td>
            </tr>
        `
        )
        .join("");
}

function renderAdminEnrollmentsTable() {
    const tbody = document.getElementById("tbody-enrollments");
    if (!tbody) return;

    if (!state.adminEnrollments || state.adminEnrollments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No enrollment records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.adminEnrollments
        .map((e) => {
            const dateStr = new Date(e.enrollmentDate).toLocaleDateString();
            const studentName = e.student ? e.student.name : "Deleted User";
            const courseTitle = e.course ? `${e.course.code} - ${e.course.title}` : "Deleted Course";

            return `
            <tr>
                <td style="font-weight: 600; color: var(--text-primary);">${escapeHTML(studentName)}</td>
                <td>${escapeHTML(courseTitle)}</td>
                <td>${dateStr}</td>
                <td><span style="font-weight: 700; color: #fde047;">${escapeHTML(e.grade || "In Progress")}</span></td>
                <td><span class="status-badge status-${e.status}">${escapeHTML(e.status)}</span></td>
                <td class="text-right">
                    <button class="btn btn-outline btn-sm" onclick="openEnrollmentEditModal('${e._id}', '${escapeHTML(studentName)}', '${escapeHTML(courseTitle)}', '${e.status}', '${e.grade || ""}')">
                        Grade / Status
                    </button>
                </td>
            </tr>
        `;
        })
        .join("");
}

// ==========================================
// Filters & Search
// ==========================================
function initFiltersAndSearch() {
    const searchInput = document.getElementById("course-search-input");
    const clearBtn = document.getElementById("btn-clear-search");
    const sortSelect = document.getElementById("sort-select");
    const pills = document.querySelectorAll(".category-pill");
    const resetBtn = document.getElementById("btn-reset-filters");

    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value;
        clearBtn.style.display = val ? "block" : "none";

        debounceTimer = setTimeout(() => {
            state.searchQuery = val;
            fetchCourses();
        }, 300);
    });

    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.style.display = "none";
        state.searchQuery = "";
        fetchCourses();
    });

    sortSelect.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        fetchCourses();
    });

    pills.forEach((pill) => {
        pill.addEventListener("click", () => {
            pills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            state.activeCategory = pill.getAttribute("data-category");
            fetchCourses();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            searchInput.value = "";
            clearBtn.style.display = "none";
            state.searchQuery = "";
            state.sortBy = "default";
            sortSelect.value = "default";
            state.activeCategory = "All";
            pills.forEach((p) => {
                p.classList.toggle("active", p.getAttribute("data-category") === "All");
            });
            fetchCourses();
        });
    }
}

// ==========================================
// Authentication & Modals
// ==========================================
function initModals() {
    // Auth Modal open triggers
    document.getElementById("btn-open-login").addEventListener("click", () => openAuthModal("login"));
    document.getElementById("btn-open-register").addEventListener("click", () => openAuthModal("register"));
    document.getElementById("btn-quick-demo").addEventListener("click", () => openAuthModal("login"));

    const dashLogin = document.getElementById("btn-dashboard-login");
    if (dashLogin) dashLogin.addEventListener("click", () => openAuthModal("login"));

    const dashDemo = document.getElementById("btn-dashboard-demo-student");
    if (dashDemo) {
        dashDemo.addEventListener("click", () => {
            quickDemoLogin("aarav@student.edu", "student123");
        });
    }

    // Modal Close buttons
    document.getElementById("btn-close-auth-modal").addEventListener("click", closeAuthModal);
    document.getElementById("btn-close-course-details").addEventListener("click", closeCourseDetailsModal);
    document.getElementById("btn-close-course-form").addEventListener("click", closeCourseFormModal);
    document.getElementById("btn-cancel-course-form").addEventListener("click", closeCourseFormModal);
    document.getElementById("btn-close-enrollment-edit").addEventListener("click", closeEnrollmentEditModal);
    document.getElementById("btn-cancel-enrollment-edit").addEventListener("click", closeEnrollmentEditModal);

    // Click outside backdrop to close
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) {
                backdrop.style.display = "none";
            }
        });
    });

    // Auth Tabs toggle
    const tabLogin = document.getElementById("tab-btn-login");
    const tabReg = document.getElementById("tab-btn-register");
    const formLogin = document.getElementById("form-login");
    const formReg = document.getElementById("form-register");

    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabReg.classList.remove("active");
        formLogin.style.display = "block";
        formReg.style.display = "none";
    });

    tabReg.addEventListener("click", () => {
        tabReg.classList.add("active");
        tabLogin.classList.remove("active");
        formReg.style.display = "block";
        formLogin.style.display = "none";
    });

    // Demo Buttons inside Login Form
    document.getElementById("btn-demo-student-1").addEventListener("click", () => {
        quickDemoLogin("aarav@student.edu", "student123");
    });
    document.getElementById("btn-demo-student-2").addEventListener("click", () => {
        quickDemoLogin("priya@student.edu", "student123");
    });
    document.getElementById("btn-demo-admin").addEventListener("click", () => {
        quickDemoLogin("admin@college.edu", "admin123");
    });

    // Login Form Submit
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const res = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            if (res.success) {
                setSession(res.token, res.user);
                closeAuthModal();
                showToast(`Welcome back, ${res.user.name}!`, "success");
                await refreshAllData();
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    // Register Form Submit
    formReg.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const role = document.getElementById("reg-role").value;
        const department = document.getElementById("reg-dept").value.trim();
        const semester = document.getElementById("reg-sem").value;

        try {
            const res = await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    department,
                    semester
                })
            });

            if (res.success) {
                setSession(res.token, res.user);
                closeAuthModal();
                showToast(`Account registered successfully! Welcome, ${res.user.name}.`, "success");
                await refreshAllData();
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    // Sign out button
    document.getElementById("btn-logout").addEventListener("click", () => {
        clearSession();
        showToast("Signed out successfully", "info");
        switchTab("catalog");
        refreshAllData();
    });
}

function openAuthModal(defaultTab = "login") {
    const modal = document.getElementById("modal-auth");
    const tabLogin = document.getElementById("tab-btn-login");
    const tabReg = document.getElementById("tab-btn-register");
    const formLogin = document.getElementById("form-login");
    const formReg = document.getElementById("form-register");

    if (defaultTab === "register") {
        tabReg.classList.add("active");
        tabLogin.classList.remove("active");
        formReg.style.display = "block";
        formLogin.style.display = "none";
    } else {
        tabLogin.classList.add("active");
        tabReg.classList.remove("active");
        formLogin.style.display = "block";
        formReg.style.display = "none";
    }

    modal.style.display = "flex";
}

function closeAuthModal() {
    document.getElementById("modal-auth").style.display = "none";
}

async function quickDemoLogin(email, password) {
    try {
        const res = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (res.success) {
            setSession(res.token, res.user);
            closeAuthModal();
            showToast(`Logged in as ${res.user.name} (${res.user.role.toUpperCase()})`, "success");
            await refreshAllData();
            if (res.user.role === "admin") {
                switchTab("admin");
            } else {
                switchTab("catalog");
            }
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// Course Details Modal
// ==========================================
window.openCourseDetailsModal = function (courseId) {
    const course = state.courses.find((c) => c._id === courseId);
    if (!course) return;

    const modal = document.getElementById("modal-course-details");
    const content = document.getElementById("course-details-content");

    const syllabusItems = (course.syllabus || []).map(
        (item, idx) => `
        <li class="syllabus-item">
            <span class="syllabus-num">Module ${idx + 1}</span>
            <span>${escapeHTML(item)}</span>
        </li>
    `
    ).join("");

    const isFull = course.enrolledCount >= course.capacity;

    content.innerHTML = `
        <div class="course-card-header" style="margin-bottom: 8px;">
            <span class="course-code-badge">${escapeHTML(course.code)}</span>
            <span class="course-category-badge">${escapeHTML(course.category)}</span>
        </div>
        <h2 class="modal-title">${escapeHTML(course.title)}</h2>
        <p class="modal-desc">${escapeHTML(course.description)}</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 22px;">
            <div class="stat-card" style="padding: 14px 18px;">
                <div class="stat-icon stat-blue" style="width: 38px; height: 38px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="stat-details">
                    <span style="font-size: 0.95rem; font-weight: 700;">${escapeHTML(course.instructor)}</span>
                    <span class="stat-label">Faculty Instructor</span>
                </div>
            </div>
            <div class="stat-card" style="padding: 14px 18px;">
                <div class="stat-icon stat-cyan" style="width: 38px; height: 38px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div class="stat-details">
                    <span style="font-size: 0.95rem; font-weight: 700;">${escapeHTML(course.schedule || "Regular")}</span>
                    <span class="stat-label">Meeting Timings</span>
                </div>
            </div>
            <div class="stat-card" style="padding: 14px 18px;">
                <div class="stat-icon stat-purple" style="width: 38px; height: 38px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <div class="stat-details">
                    <span style="font-size: 0.95rem; font-weight: 700;">${course.credits} Credits</span>
                    <span class="stat-label">Academic Weight</span>
                </div>
            </div>
        </div>

        <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 10px;">Curricular Syllabus & Key Topics</h4>
        <ul class="syllabus-list">
            ${syllabusItems || "<li class='syllabus-item'>Standard accredited curriculum modules.</li>"}
        </ul>

        <div class="modal-form-actions">
            <button class="btn btn-outline" onclick="closeCourseDetailsModal()">Close</button>
            ${
                state.user && state.user.role === "student"
                    ? `<button class="btn btn-primary" onclick="handleEnroll('${course._id}'); closeCourseDetailsModal();" ${isFull ? "disabled" : ""}>
                        ${isFull ? "Class Full" : "Enroll in Course"}
                       </button>`
                    : ""
            }
        </div>
    `;

    modal.style.display = "flex";
};

function closeCourseDetailsModal() {
    document.getElementById("modal-course-details").style.display = "none";
}

// ==========================================
// Admin Course Management (Create, Edit, Delete)
// ==========================================
function initAdminControls() {
    // Top Add Course button
    const btnAddTop = document.getElementById("btn-add-course-top");
    if (btnAddTop) {
        btnAddTop.addEventListener("click", () => openAddCourseModal());
    }

    const btnAdminAdd = document.getElementById("btn-admin-add-course");
    if (btnAdminAdd) {
        btnAdminAdd.addEventListener("click", () => openAddCourseModal());
    }

    // Admin subtabs
    const subnavBtns = document.querySelectorAll(".admin-nav-btn");
    subnavBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            subnavBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const subtab = btn.getAttribute("data-subtab");
            document.querySelectorAll(".admin-subcontent").forEach((c) => c.classList.remove("active"));
            document.getElementById(subtab).classList.add("active");
        });
    });

    // Course Form submit
    const courseForm = document.getElementById("form-manage-course");
    courseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("course-form-id").value;
        const title = document.getElementById("cf-title").value.trim();
        const code = document.getElementById("cf-code").value.trim().toUpperCase();
        const description = document.getElementById("cf-description").value.trim();
        const instructor = document.getElementById("cf-instructor").value.trim();
        const category = document.getElementById("cf-category").value;
        const credits = Number(document.getElementById("cf-credits").value);
        const capacity = Number(document.getElementById("cf-capacity").value);
        const schedule = document.getElementById("cf-schedule").value.trim();
        const syllabusRaw = document.getElementById("cf-syllabus").value.trim();

        const syllabus = syllabusRaw
            ? syllabusRaw.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        const payload = {
            title,
            code,
            description,
            instructor,
            category,
            credits,
            capacity,
            schedule,
            syllabus
        };

        try {
            let res;
            if (id) {
                // Update
                res = await apiRequest(`/courses/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                res = await apiRequest("/courses", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }

            if (res.success) {
                showToast(res.message || "Course saved successfully!", "success");
                closeCourseFormModal();
                await fetchCourses();
                await fetchStats();
                if (state.activeTab === "admin") {
                    renderAdminCoursesTable();
                }
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    // Enrollment Edit Form Submit
    const enrollForm = document.getElementById("form-edit-enrollment");
    enrollForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-enrollment-id").value;
        const status = document.getElementById("edit-enrollment-status").value;
        const grade = document.getElementById("edit-enrollment-grade").value.trim();

        try {
            const res = await apiRequest(`/enrollments/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status, grade })
            });

            if (res.success) {
                showToast("Enrollment record updated successfully!", "success");
                closeEnrollmentEditModal();
                await fetchAdminData();
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function openAddCourseModal() {
    document.getElementById("course-form-title").textContent = "Add New Course Offering";
    document.getElementById("course-form-id").value = "";
    document.getElementById("cf-title").value = "";
    document.getElementById("cf-code").value = "";
    document.getElementById("cf-description").value = "";
    document.getElementById("cf-instructor").value = "";
    document.getElementById("cf-category").value = "Computer Science";
    document.getElementById("cf-credits").value = "4";
    document.getElementById("cf-capacity").value = "40";
    document.getElementById("cf-schedule").value = "";
    document.getElementById("cf-syllabus").value = "";

    document.getElementById("modal-course-form").style.display = "flex";
}

window.openEditCourseModal = function (courseId) {
    const course = state.courses.find((c) => c._id === courseId);
    if (!course) return;

    document.getElementById("course-form-title").textContent = `Edit Course: ${course.code}`;
    document.getElementById("course-form-id").value = course._id;
    document.getElementById("cf-title").value = course.title;
    document.getElementById("cf-code").value = course.code;
    document.getElementById("cf-description").value = course.description;
    document.getElementById("cf-instructor").value = course.instructor;
    document.getElementById("cf-category").value = course.category;
    document.getElementById("cf-credits").value = course.credits;
    document.getElementById("cf-capacity").value = course.capacity;
    document.getElementById("cf-schedule").value = course.schedule || "";
    document.getElementById("cf-syllabus").value = (course.syllabus || []).join(", ");

    document.getElementById("modal-course-form").style.display = "flex";
};

function closeCourseFormModal() {
    document.getElementById("modal-course-form").style.display = "none";
}

window.handleDeleteCourse = async function (courseId) {
    const course = state.courses.find((c) => c._id === courseId);
    const title = course ? course.title : "this course";

    if (!confirm(`Are you sure you want to permanently delete '${title}' and remove all student enrollments?`)) {
        return;
    }

    try {
        const res = await apiRequest(`/courses/${courseId}`, {
            method: "DELETE"
        });

        if (res.success) {
            showToast(res.message || "Course deleted successfully", "info");
            await fetchCourses();
            await fetchStats();
            if (state.activeTab === "admin") {
                renderAdminCoursesTable();
            }
        }
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.handleDeleteStudent = async function (studentId) {
    if (!confirm("Are you sure you want to delete this student account and unenroll them from all courses?")) {
        return;
    }

    try {
        const res = await apiRequest(`/students/${studentId}`, {
            method: "DELETE"
        });

        if (res.success) {
            showToast("Student account deleted successfully", "info");
            await fetchAdminData();
            await fetchStats();
        }
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.openEnrollmentEditModal = function (enrollmentId, studentName, courseTitle, currentStatus, currentGrade) {
    document.getElementById("edit-enrollment-id").value = enrollmentId;
    document.getElementById("enrollment-edit-meta").textContent = `${studentName} • ${courseTitle}`;
    document.getElementById("edit-enrollment-status").value = currentStatus;
    document.getElementById("edit-enrollment-grade").value = currentGrade;

    document.getElementById("modal-enrollment-edit").style.display = "flex";
};

function closeEnrollmentEditModal() {
    document.getElementById("modal-enrollment-edit").style.display = "none";
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    else if (type === "error") icon = "⚠️";

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// Utilities
// ==========================================
function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
