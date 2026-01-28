# 🎓 Kiddo Backend - API Documentation

> **AI-Powered Learning Platform for Schools**

## 📋 Quick Reference

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:5000/api` |
| **Authentication** | JWT Bearer Token |
| **Date Format** | ISO 8601 (YYYY-MM-DD) |
| **API Version** | 1.0.0 |

---

## 📚 Table of Contents

1. [🔐 Authentication](#1--authentication)
2. [🏫 Schools](#2--schools)
3. [👨‍🎓 Students](#3--students)
4. [👨‍🏫 Teachers](#4--teachers)
5. [👨‍👩‍👧 Parents](#5--parents)
6. [📂 Sections](#6--sections)
7. [🎓 Classes](#7--classes)
8. [✅ Approvals](#8--approvals)
9. [📊 Attendance](#9--attendance)
10. [📝 Homework](#10--homework)
11. [🔔 Notifications](#11--notifications)
12. [📄 Report Cards & Exams](#12--report-cards--exams)
13. [📅 Timetables](#13--timetables)
14. [🤖 AI Features](#14--ai-features)
15. [🎮 Game & Quiz](#15--game--quiz)
16. [💬 Group Chat](#16--group-chat)
17. [💳 Subscriptions](#17--subscriptions)
18. [📜 Audit Logs](#18--audit-logs)
19. [⚡ Bulk Operations](#19--bulk-operations)
20. [📊 Dashboards](#20--dashboards)
21. [🔌 Socket.IO](#21--socketio)

---

## 1. 🔐 Authentication

### 1.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Auth:** ❌ Public
- **Validation:** `loginSchema`

---

## 2. 🏫 Schools

**Base:** `/api/schools`  
**Auth:** ✅ Required (`super_admin`)

### 2.1 Create School
- **Endpoint:** `POST /api/schools`
- **Validation:** `createSchoolSchema`

### 2.2 List Schools
- **Endpoint:** `GET /api/schools`

### 2.3 Update School Status
- **Endpoint:** `PATCH /api/schools/:id/status`
- **Validation:** `updateSchoolStatusSchema`

### 2.4 Update School Admin Status
- **Endpoint:** `PATCH /api/schools/:id/admin-status`

### 2.5 Reset School Admin Password
- **Endpoint:** `PATCH /api/schools/:id/admin-reset-password`

---

## 3. 👨‍🎓 Students

**Base:** `/api/students`

### 3.1 Complete Profile (First Login)
- **Endpoint:** `POST /api/students/complete-profile`
- **Auth:** ✅ Required (`student`)

### 3.2 Get My Profile
- **Endpoint:** `GET /api/students/me`
- **Auth:** ✅ Required (`student`)
- **Middleware:** `forceFirstLogin`

### 3.3 Auto-Create Students
- **Endpoint:** `POST /api/students/auto-create`
- **Auth:** ✅ Required (`school_admin`)

### 3.4 List Students
- **Endpoint:** `GET /api/students`
- **Auth:** ✅ Required (`school_admin`)

### 3.5 Move Student
- **Endpoint:** `PATCH /api/students/:id/move`
- **Auth:** ✅ Required (`school_admin`)

### 3.6 Update Student Status
- **Endpoint:** `PATCH /api/students/:id/status`
- **Auth:** ✅ Required (`school_admin`)

### 3.7 Assign to Section
- **Endpoint:** `POST /api/students/assign-section`
- **Auth:** ✅ Required (`school_admin`)

---

## 4. 👨‍🏫 Teachers

**Base:** `/api/teachers`

### 4.1 Complete Profile (First Login)
- **Endpoint:** `POST /api/teachers/complete-profile`
- **Auth:** ✅ Required (`teacher`)

### 4.2 Get My Profile
- **Endpoint:** `GET /api/teachers/me`
- **Auth:** ✅ Required (`teacher`)
- **Middleware:** `forceFirstLogin`

### 4.3 Create Teacher
- **Endpoint:** `POST /api/teachers`
- **Auth:** ✅ Required (`school_admin`)

### 4.4 List Teachers
- **Endpoint:** `GET /api/teachers`
- **Auth:** ✅ Required (`school_admin`)

### 4.5 Update Teacher Status
- **Endpoint:** `PATCH /api/teachers/:id/status`
- **Auth:** ✅ Required (`school_admin`)

---

## 5. 👨‍👩‍👧 Parents

**Base:** `/api/parents`

### 5.1 Create Parent (Admin)
- **Endpoint:** `POST /api/parents`

### 5.2 Link Parent (Admin)
- **Endpoint:** `POST /api/parents/link`

### 5.3 Update Profile
- **Endpoint:** `PATCH /api/parents/profile`

---

## 6. 📂 Sections

**Base:** `/api/sections`

### 6.1 Create Section
- **Endpoint:** `POST /api/sections`

### 6.2 List Sections by Class
- **Endpoint:** `GET /api/sections/classes/:class_id/sections`

### 6.3 Update Section Status
- **Endpoint:** `PATCH /api/sections/:id/status`

---

## 7. 🎓 Classes

**Base:** `/api/classes`  
**Note:** Uses Joi validation

### 7.1 Create Class
- **Endpoint:** `POST /api/classes`
- **Validation:** `createClassSchema`

### 7.2 List Classes
- **Endpoint:** `GET /api/classes`

### 7.3 Get Class by ID
- **Endpoint:** `GET /api/classes/:id`

### 7.4 Update Class
- **Endpoint:** `PATCH /api/classes/:id`
- **Validation:** `updateClassSchema`

### 7.5 Delete Class
- **Endpoint:** `DELETE /api/classes/:id`

---

## 8. ✅ Approvals

### 8.1 Teacher Pending Approvals
- **Endpoint:** `GET /api/teachers/approvals/pending`
- **Auth:** ✅ Required (`teacher`)

### 8.2 Admin Pending Approvals
- **Endpoint:** `GET /api/admin/approvals/pending`
- **Auth:** ✅ Required (`admin`)

### 8.3 Student Profile Update Request
- **Endpoint:** `PATCH /api/students/profile/request`
- **Auth:** ✅ Required (`student`)

### 8.4 Approve Student Profile
- **Endpoint:** `POST /api/teachers/students/:student_id/approve`
- **Auth:** ✅ Required (`teacher`)

### 8.5 Teacher Profile Update Request
- **Endpoint:** `PATCH /api/teachers/profile/request`
- **Auth:** ✅ Required (`teacher`)

### 8.6 Approve Teacher Profile
- **Endpoint:** `POST /api/admin/teachers/:teacher_id/approve`
- **Auth:** ✅ Required (`admin`)

### 8.7 Teacher Create Parent
- **Endpoint:** `POST /api/teachers/parents`
- **Auth:** ✅ Required (`teacher`)

### 8.8 Approve Parent
- **Endpoint:** `POST /api/admin/parents/:parent_id/approve`
- **Auth:** ✅ Required (`admin`)

---

## 9. 📊 Attendance

### 9.1 Mark Attendance
- **Endpoint:** `POST /api/teachers/attendance`
- **Auth:** ✅ Required (`teacher`)

### 9.2 Teacher Attendance Summary
- **Endpoint:** `GET /api/teachers/attendance/summary`
- **Auth:** ✅ Required (`teacher`)

### 9.3 Parent Attendance Summary
- **Endpoint:** `GET /api/parents/attendance/summary`
- **Auth:** ✅ Required (`parent`)

### 9.4 Teacher Attendance Analytics
- **Endpoint:** `GET /api/teachers/attendance/analytics`
- **Auth:** ✅ Required (`teacher`)

### 9.5 Parent Attendance Analytics
- **Endpoint:** `GET /api/parents/attendance/analytics`
- **Auth:** ✅ Required (`parent`)

---

## 10. 📝 Homework

**Note:** Routes not mounted in server.js (module exists but not active)

### 10.1 Create Homework
- **Endpoint:** `POST /api/homework`
- **Permission:** `allowAdminOrSectionClassTeacher`
- **Validation:** `createHomeworkSchema`

### 10.2 List Homework
- **Endpoint:** `GET /api/homework`
- **Validation:** `listHomeworkSchema`

### 10.3 Submit Homework
- **Endpoint:** `POST /api/homework/:homework_id/submit`

### 10.4 Homework Summary
- **Endpoint:** `GET /api/homework/analytics/summary`

### 10.5 Homework Student Status
- **Endpoint:** `GET /api/homework/analytics/:homework_id/students`

---

## 11. 🔔 Notifications

**Note:** Routes not mounted in server.js (module exists but not active)

### 11.1 Create Notification
- **Endpoint:** `POST /api/notifications`
- **Auth:** ✅ Required (`admin` or `teacher`)

### 11.2 List Notifications
- **Endpoint:** `GET /api/notifications`
- **Auth:** ✅ Required

### 11.3 Acknowledge Notification
- **Endpoint:** `POST /api/notifications/:id/acknowledge`
- **Auth:** ✅ Required

### 11.4 List Acknowledgments
- **Endpoint:** `GET /api/notifications/:id/acknowledgements`
- **Auth:** ✅ Required

---

## 12. 📄 Report Cards & Exams

**Note:** Routes not mounted in server.js (module exists but not active)

### 12.1 Create Exam
- **Endpoint:** `POST /api/exams`
- **Auth:** ✅ Required (`teacher` or `admin`)

### 12.2 Lock Exam
- **Endpoint:** `POST /api/exams/:id/lock`
- **Auth:** ✅ Required (`teacher` or `admin`)

### 12.3 List Exams
- **Endpoint:** `GET /api/exams`
- **Auth:** ✅ Required

### 12.4 Create Report Card
- **Endpoint:** `POST /api/report-cards`
- **Permission:** `allowAdminOrClassTeacher`
- **Validation:** `createReportCardSchema`

### 12.5 Save Marks
- **Endpoint:** `POST /api/report-cards/:id/marks`
- **Validation:** `saveReportCardMarksSchema`

### 12.6 Publish Report Card
- **Endpoint:** `POST /api/report-cards/:id/publish`
- **Permission:** `allowAdminOrClassTeacher`
- **Validation:** `publishReportCardSchema`

### 12.7 Get Report Card
- **Endpoint:** `GET /api/report-cards/:id`

---

## 13. 📅 Timetables

**Note:** Routes not mounted in server.js (module exists but not active)

### 13.1 Save Timetable
- **Endpoint:** `POST /api/timetables`
- **Permission:** `allowAdminOrSectionClassTeacher`
- **Validation:** `saveTimetableSchema`

### 13.2 Get Timetable
- **Endpoint:** `GET /api/timetables`

---

## 14. 🤖 AI Features

### 14.1 RAG - Ask Question
- **Endpoint:** `POST /api/rag/ask`
- **Auth:** ✅ Required
- **Rate Limit:** ⚡ 10 requests/minute
- **Tech:** ChromaDB + Gemini AI

### 14.2 Teacher AI
- **Endpoint:** `POST /api/teacher/ai`
- **Auth:** ✅ Required (`teacher`)

### 14.3 School AI Analytics
- **Endpoint:** `GET /api/analytics/ai/school`
- **Auth:** ✅ Required (`school_admin` or `super_admin`)

### 14.4 Teacher AI Analytics
- **Endpoint:** `GET /api/analytics/ai/teacher`
- **Auth:** ✅ Required (`teacher`)

### 14.5 Student AI Analytics
- **Endpoint:** `GET /api/analytics/ai/student`
- **Auth:** ✅ Required (`student`)

---

## 15. 🎮 Game & Quiz

**Note:** Routes not mounted in server.js (module exists but not active)

### 15.1 Submit Single Player Quiz
- **Endpoint:** `POST /api/quiz/single/submit`
- **Auth:** ✅ Required

---

## 16. 💬 Group Chat

**Note:** Routes not mounted in server.js (module exists but not active)

### 16.1 Create Group Chat
- **Endpoint:** `POST /api/group-chat`
- **Middleware:** `auth`, `schoolScope`

### 16.2 List Group Chats
- **Endpoint:** `GET /api/group-chat`
- **Middleware:** `auth`, `schoolScope`

---

## 17. 💳 Subscriptions

### 17.1 Upsert Subscription
- **Endpoint:** `POST /api/subscriptions`
- **Auth:** ✅ Required (`super_admin`)

---

## 18. 📜 Audit Logs

### 18.1 List Audit Logs
- **Endpoint:** `GET /api/admin/audit-logs`
- **Auth:** ✅ Required (`admin`)

---

## 19. ⚡ Bulk Operations

### 19.1 Bulk Approve Teachers
- **Endpoint:** `POST /api/admin/teachers/bulk-approve`
- **Auth:** ✅ Required (`admin`)

### 19.2 Bulk Approve Parents
- **Endpoint:** `POST /api/admin/parents/bulk-approve`
- **Auth:** ✅ Required (`admin`)

---

## 20. 📊 Dashboards

### 20.1 Parent Children List
- **Endpoint:** `GET /api/parents/children`
- **Auth:** ✅ Required (`parent`)

### 20.2 Parent Dashboard
- **Endpoint:** `GET /api/parents/dashboard`
- **Auth:** ✅ Required (`parent`)

### 20.3 Teacher Dashboard
- **Endpoint:** `GET /api/teachers/dashboard`
- **Auth:** ✅ Required (`teacher`)

---

## 21. 🔌 Socket.IO

**Connection:** `http://localhost:5000`  
**Auth:** JWT token in handshake

### Game Socket Events
- Initialized via `initGameSocket(io)`
- See `src/socket/game.socket.js`

### Group Chat Socket Events
- Initialized via `initGroupChatSocket(io)`
- See `src/socket/group-chat.socket.js`

### Notification Socket Events
- Initialized via `initNotificationSocket(io)`
- See `src/socket/notification.socket.js`

---

## 📊 Active Routes Summary

Based on `server.js` mounting:

| Module | Base Path | Status |
|--------|-----------|--------|
| Auth | `/api/auth` | ✅ Active |
| Schools | `/api/schools` | ✅ Active |
| Students | `/api/students` | ✅ Active |
| Teachers | `/api/teachers` | ✅ Active |
| Parents | `/api/parents` | ✅ Active |
| Sections | `/api/sections` | ✅ Active |
| Approvals | `/api` | ✅ Active |
| Teacher Approvals | `/api` | ✅ Active |
| Student Approvals | `/api` | ✅ Active |
| Parent Approvals | `/api` | ✅ Active |
| Parent Dashboard | `/api` | ✅ Active |
| Audit | `/api` | ✅ Active |
| Parent Bulk | `/api` | ✅ Active |
| Teacher Bulk | `/api` | ✅ Active |
| Attendance Summary | `/api` | ✅ Active |
| Attendance Analytics | `/api` | ✅ Active |
| RAG | `/api/rag` | ✅ Active |
| Teacher AI | `/api` | ✅ Active |
| AI Analytics | `/api` | ✅ Active |
| Subscriptions | `/api` | ✅ Active |
| Classes | - | ❌ Not Mounted |
| Homework | - | ❌ Not Mounted |
| Notifications | - | ❌ Not Mounted |
| Report Cards | - | ❌ Not Mounted |
| Exams | - | ❌ Not Mounted |
| Timetables | - | ❌ Not Mounted |
| Game/Quiz | - | ❌ Not Mounted |
| Group Chat | - | ❌ Not Mounted |
| Teacher Dashboard | - | ❌ Not Mounted |

---

## 👥 Role-Based Access

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access, school management |
| `school_admin` | School-level management, user creation |
| `teacher` | Class management, attendance, approvals |
| `student` | View own data, submit work |
| `parent` | View children's data |

---

## 📝 Notes

1. **School Scoping:** Most endpoints filter by `school_id` from JWT
2. **First Login:** Users must complete profile on first login
3. **Validation:** Mix of Zod and Joi schemas
4. **CORS:** Configured for `localhost:5173` and `localhost:5174`
5. **Database:** PostgreSQL with Sequelize ORM
6. **⚠️ CRITICAL:** `db.sync({ force: true })` in server.js drops all tables on restart

---

## 📧 Support

For issues and questions, please contact me or create an issue in the repository.

**Repository:** [https://github.com/aravindh99/kiddo-backend](https://github.com/aravindh99/kiddo-backend)

---

**Last Updated:** 2026-01-28  
**Maintained by:** https://github.com/aravindh99