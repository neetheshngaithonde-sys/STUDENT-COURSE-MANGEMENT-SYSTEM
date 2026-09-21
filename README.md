# EduPulse - Student Course Management System

> **Comprehensive 10-Week Engineering Project Progression**  
> **Current Milestone**: Weeks 1 through 7 Completed & Modernized UI/UX

EduPulse is a full-stack academic web platform designed to streamline course discovery, student registrations, enrollment tracking, and administrative curriculum governance. Built with modern Node.js, Express.js, MongoDB (Mongoose ODM), Bcrypt authentication, JWT security, and a responsive glassmorphic frontend.

---

## 📅 10-Week Progression Schedule & Completion Status

| Week | Technical Focus | Milestone Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **Week 1** | Node.js, NPM, server-side scripting | **COMPLETED** | Project initialization, package setup, initial server, requirements. |
| **Week 2** | Node.js Event Loop, modular architecture | **COMPLETED** | Modular backend structure (`config`, `controllers`, `models`, `routes`, `middleware`). |
| **Week 3** | Express.js, routing, request/response | **COMPLETED** | Express router configurations, HTTP verbs, initial route handlers. |
| **Week 4** | Custom middleware, static files, error handling | **COMPLETED** | Custom request logger, centralized error handler, static assets serving. |
| **Week 5** | Database connectivity & data modeling | **COMPLETED** | MongoDB connection via Mongoose, schema definitions for `User`, `Student`, `Course`, `Enrollment`, relational `schema.sql`. |
| **Week 6** | CRUD operations, queries & filtering | **COMPLETED** | Complete RESTful CRUD APIs for all resources, category filtering, search queries, capacity tracking. |
| **Week 7** | Authentication, Bcrypt, JWT & Security | **COMPLETED** | Bcrypt password hashing, JWT bearer tokens, role authorization (`student` vs `admin`), route protection. |
| **UI/UX** | Modern Frontend Interface | **COMPLETED** | High-end glassmorphic SPA with course catalog, live search, student learning hub, and admin management center. |
| **Week 8** | Advanced security, validation, logging | *Upcoming* | Rate limiting, input validation sanitization, Winston logging. |
| **Week 9** | Production frontend-backend integration | *Upcoming* | Production builds, automated integration test suites. |
| **Week 10**| Cloud deployment & finalization | *Upcoming* | Cloud deployment (Render/Vercel/Atlas), final presentation. |

---

## 🛠️ Technology Stack

- **Runtime & Server**: Node.js (v24+), Express.js 4.x
- **Database**: MongoDB with Mongoose ODM (v9.x), MySQL compatible schema in `database/schema.sql`
- **Authentication & Security**:
  - `bcryptjs` for salted cryptographic password hashing
  - `jsonwebtoken` (JWT) with 30-day token lifespans and bearer authorization
  - Role-Based Access Control (RBAC): `student` and `admin` roles
  - `cors` enabled for universal API integration
- **Frontend Architecture**:
  - Semantic HTML5 with accessible ARIA landmarks
  - Vanilla CSS3 Design System with Glassmorphism, CSS Variables, and responsive grids
  - Vanilla ES6+ JavaScript client with reactive state management

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or MongoDB Atlas connection string)

### 2. Installation
Navigate to the backend directory and install dependencies:
```bash
cd student-course-management-system/backend
npm install
```

### 3. Environment Configuration
Create or verify `.env` in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_course_management
JWT_SECRET=student_course_management_secure_jwt_secret_key_2026
NODE_ENV=development
```

### 4. Database Seeding
Populate the database with sample administrators, students, and courses:
```bash
npm run seed
```

### 5. Start the Application
Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:5000
```

---

## 👥 Default Demo Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | College Administrator | `admin@college.edu` | `admin123` |
| **Student 1** | Aarav Sharma | `aarav@student.edu` | `student123` |
| **Student 2** | Priya Patel | `priya@student.edu` | `student123` |

> 💡 *Note*: The frontend includes a **1-Click Demo Login** bar inside the Sign In modal so you can test all roles instantly without typing!

---

## 📡 Complete REST API Documentation

### 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (Student or Admin profile) |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password, returns JWT |
| `GET` | `/api/auth/me` | Private | Retrieve logged-in user profile & role |

### 2. Courses Endpoints (`/api/courses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/courses` | Public | Get all courses with query parameters: `category`, `search`, `credits`, `sort` |
| `GET` | `/api/courses/:id` | Public | Get detailed information for a single course |
| `GET` | `/api/courses/stats/summary` | Public | Aggregate stats: total courses, enrollments, disciplines |
| `POST` | `/api/courses` | Admin | Create a new course offering |
| `PUT` | `/api/courses/:id` | Admin | Update course details, capacity, or schedule |
| `DELETE` | `/api/courses/:id` | Admin | Delete a course and its associated enrollments |

### 3. Enrollments Endpoints (`/api/enrollments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/enrollments` | Student | Enroll authenticated student into a course |
| `GET` | `/api/enrollments/my` | Student | Get all courses enrolled by the current student |
| `DELETE` | `/api/enrollments/:id` | Student/Admin | Drop / withdraw from an enrolled course |
| `GET` | `/api/enrollments` | Admin | View master enrollment roster across all courses |
| `PUT` | `/api/enrollments/:id` | Admin | Update enrollment status (`enrolled`, `completed`, `dropped`) and assign grades |

### 4. Students Endpoints (`/api/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/students` | Admin | List all registered students with profile details |
| `GET` | `/api/students/:id` | Private | View student profile and their active enrollments |
| `PUT` | `/api/students/:id` | Private | Update student details (department, semester, phone) |
| `DELETE` | `/api/students/:id` | Admin | Delete student account and all their enrollments |

---

## 🧪 Automated Testing
Run the automated test suite verifying all 10 API & security requirements:
```bash
node backend/test_api.js
```

Test Results:
```text
--> Starting Comprehensive API & Auth Tests on port 5000
1. Health Check: PASS Week 1 to Week 7 Completed
2. Admin Login: PASS Token received: true
3. Student Login: PASS Role: student
4. Get Courses Count: 6 PASS
5. Filter Category (AI): PASS
6. Search Course ('MERN'): PASS
7. Student Enroll in DS202: PASS Successfully enrolled
8. Student My Enrollments Count: 3 PASS
9. Admin Create Course: PASS MOB205
10. Role Security Check (Student creating course -> 403 Forbidden): PASS
ALL 10 API & SECURITY TESTS COMPLETED SUCCESSFULLY!
```

---

## 📁 Repository Structure
```text
student-course-management-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongoose database connection
│   ├── controllers/
│   │   ├── authController.js     # Signup, login, session handlers
│   │   ├── courseController.js   # Course CRUD, filtering, search, stats
│   │   ├── enrollmentController.js# Enrollment logic & seat capacity tracking
│   │   └── studentController.js  # Student directory & profile handlers
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & RBAC authorization
│   │   ├── errorHandler.js       # Centralized error handler
│   │   └── logger.js             # HTTP request logger
│   ├── models/
│   │   ├── courseModel.js        # Course schema with capacity virtuals
│   │   ├── enrollmentModel.js    # Enrollment schema with compound index
│   │   ├── studentModel.js       # Student profile schema
│   │   └── userModel.js          # User schema with bcrypt pre-save hook
│   ├── routes/
│   │   ├── authRoutes.js         # Auth routing
│   │   ├── courseRoutes.js       # Course routing
│   │   ├── enrollmentRoutes.js   # Enrollment routing
│   │   └── studentRoutes.js      # Student routing
│   ├── .env                      # Environment config (gitignored)
│   ├── .env.example              # Template config
│   ├── package.json              # Backend dependencies & scripts
│   ├── seed.js                   # Database seeder
│   ├── server.js                 # Express application entry point
│   └── test_api.js               # Comprehensive automated test suite
├── database/
│   └── schema.sql                # Relational MySQL database schema
├── frontend/
│   ├── css/
│   │   └── style.css             # Glassmorphism design system & styles
│   ├── js/
│   │   └── script.js             # Client application logic & API connectors
│   └── index.html                # Semantic single-page application
└── README.md                     # Project documentation
```

---
*Created as part of the 10-Week Engineering Curriculum • Weeks 1 to 7 Deliverables Complete.*
