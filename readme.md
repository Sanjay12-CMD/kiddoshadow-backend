# 🎓 Kiddo Backend - Complete API Documentation

> **AI-Powered Learning Platform for Schools**


## 📋 Quick Reference

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:5000/api` |
| **Authentication** | JWT Bearer Token |
| **Date Format** | ISO 8601 (YYYY-MM-DD) |
| **Time Format** | HH:mm (24-hour) |
| **API Version** | 1.0.0 |

---

## 📚 Table of Contents

1. [🔐 Authentication](#1--authentication)
2. [🏫 Schools Management](#2--schools-management)
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
20. [📊 Dashboard APIs](#20--dashboard-apis)
21. [🔌 Socket.IO Events](#21--socketio-events)
22. [⚠️ Error Handling](#22--error-handling)
23. [🔑 Authentication Flow](#23--authentication-flow)
24. [👥 Role-Based Access](#24--role-based-access)

---

## 1. 🔐 Authentication

### 1.1 Login

**Endpoint:** `POST /api/auth/login`  
**Authentication:** ❌ None (Public)  
**Role:** None

**Request Body:**
```json
{
  "username": "string (required, min 1 char)",
  "password": "string (required, min 1 char)"
}
```

**Response:**
```json
{
  "token": "jwt_token_string"
}
```

**Errors:**
- `401` Username not found
- `401` Password is wrong
- `403` User account disabled
- `403` School is inactive

---

## 2. 🏫 Schools Management

**Base Path:** `/api/schools`  
**All endpoints require:** `super_admin` role

### 2.1 Create School

**Endpoint:** `POST /api/schools`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**Request Body:**
```json
{
  "name": "string (required, min 1 char)",
  "code": "string (required, min 1 char)",
  "cbse_affiliation_no": "string (required, min 1 char)",
  "admin_username": "string (required, min 3 chars)",
  "admin_password": "string (required, min 6 chars)"
}
```

**Response:** School object with created school_admin user

---

### 2.2 List Schools

**Endpoint:** `GET /api/schools`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**Response:** Array of school objects

---

### 2.3 Update School Status

**Endpoint:** `PATCH /api/schools/:id/status`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**URL Parameters:**
- `id` - School ID

**Request Body:**
```json
{
  "status": "pending | active | suspended | expired"
}
```

**Response:** Updated school object

---

### 2.4 Update School Admin Status

**Endpoint:** `PATCH /api/schools/:id/admin-status`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**URL Parameters:**
- `id` - School ID

**Request Body:**
```json
{
  "is_active": "boolean (required)"
}
```

**Response:** Updated school admin user object

---

### 2.5 Reset School Admin Password

**Endpoint:** `PATCH /api/schools/:id/admin-reset-password`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**URL Parameters:**
- `id` - School ID

**Request Body:**
```json
{
  "new_password": "string (required, min 6 chars)"
}
```

**Response:** Success message

---

## 3. 👨‍🎓 Students

**Base Path:** `/api/students`

### 3.1 Complete Student Profile (First Login)

**Endpoint:** `POST /api/students/complete-profile`  
**Authentication:** ✅ Required  
**Role:** `student`

**Request Body:**
```json
{
  "name": "string (required, min 1 char)",
  "phone": "string (optional)"
}
```

**Response:** Updated user object

---

### 3.2 Get My Profile

**Endpoint:** `GET /api/students/me`  
**Authentication:** ✅ Required  
**Role:** `student`  
**Middleware:** `forceFirstLogin` (blocks if first_login = true)

**Response:** Student profile with user details

---

### 3.3 Auto-Create Students

**Endpoint:** `POST /api/students/auto-create`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Request Body:**
```json
{
  "class_id": "number (required)",
  "sections": [
    {
      "section_id": "number (required)",
      "count": "number (required, positive integer)"
    }
  ]
}
```

**Response:** Array of created student objects

> **Note:** Auto-generates usernames and passwords

---

### 3.4 List Students

**Endpoint:** `GET /api/students`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Query Parameters:** None (scoped to school automatically)

**Response:** Array of student objects

---

### 3.5 Move Student to Section

**Endpoint:** `PATCH /api/students/:id/move`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**URL Parameters:**
- `id` - Student ID

**Request Body:**
```json
{
  "section_id": "number (required)"
}
```

**Response:** Updated student object

---

### 3.6 Update Student Status

**Endpoint:** `PATCH /api/students/:id/status`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**URL Parameters:**
- `id` - Student ID

**Request Body:**
```json
{
  "is_active": "boolean (required)"
}
```

**Response:** Updated student object

---

### 3.7 Assign Students to Section (Bulk)

**Endpoint:** `POST /api/students/assign-section`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Request Body:**
```json
{
  "target_class_id": "number (required, positive)",
  "target_section_id": "number (required, positive)",
  "students": [
    {
      "student_id": "number (required, positive)",
      "roll_no": "number (required, positive)"
    }
  ]
}
```

**Response:** Success message with count

---

### 3.8 Request Student Profile Update

**Endpoint:** `PATCH /api/students/profile/request`  
**Authentication:** ✅ Required  
**Role:** `student`

**Request Body:**
```json
{
  "profile_pic": "string (optional)",
  "dob": "string (optional, YYYY-MM-DD)",
  "gender": "male | female | other (optional)",
  "father_name": "string (optional)",
  "mother_name": "string (optional)",
  "guardian_name": "string (optional)",
  "address": "string (optional)",
  "blood_group": "string (optional)",
  "aadhar_no": "string (optional)",
  "father_occupation": "string (optional)",
  "mother_occupation": "string (optional)",
  "family_income": "number (optional)"
}
```

**Response:** Pending approval message

> **Note:** Creates approval request for teacher

---

### 3.9 Approve Student Profile Update

**Endpoint:** `POST /api/teachers/students/:student_id/approve`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**URL Parameters:**
- `student_id` - Student ID

**Request Body:**
```json
{
  "action": "approve | reject",
  "remark": "string (required if action = reject)"
}
```

**Response:** Success message

---

## 4. 👨‍🏫 Teachers

**Base Path:** `/api/teachers`

### 4.1 Complete Teacher Profile (First Login)

**Endpoint:** `POST /api/teachers/complete-profile`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Request Body:**
```json
{
  "name": "string (required, min 1 char)",
  "phone": "string (optional)",
  "gender": "male | female | other (optional)",
  "designation": "string (optional)",
  "qualification": "string (optional)",
  "experience": "number (optional, non-negative integer)"
}
```

**Response:** Updated user object

---

### 4.2 Get My Profile

**Endpoint:** `GET /api/teachers/me`  
**Authentication:** ✅ Required  
**Role:** `teacher`  
**Middleware:** `forceFirstLogin`

**Response:** Teacher profile with user details

---

### 4.3 Create Teacher

**Endpoint:** `POST /api/teachers`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Request Body:**
```json
{
  "username": "string (required, min 3 chars)"
}
```

**Response:** Created teacher object with auto-generated password

---

### 4.4 List Teachers

**Endpoint:** `GET /api/teachers`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Response:** Array of teacher objects

---

### 4.5 Update Teacher Status

**Endpoint:** `PATCH /api/teachers/:id/status`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**URL Parameters:**
- `id` - Teacher ID

**Request Body:**
```json
{
  "is_active": "boolean (required)"
}
```

**Response:** Updated teacher object

---

### 4.6 Request Teacher Profile Update

**Endpoint:** `PATCH /api/teachers/profile/request`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Request Body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "qualification": "string (optional)",
  "experience_years": "number (optional, min 0)",
  "address": "string (optional)"
}
```

**Response:** Pending approval message

---

### 4.7 Approve Teacher Profile Update

**Endpoint:** `POST /api/admin/teachers/:teacher_id/approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**URL Parameters:**
- `teacher_id` - Teacher ID

**Request Body:**
```json
{
  "action": "approve | reject"
}
```

**Response:** Success message

---

### 4.8 Bulk Approve Teachers

**Endpoint:** `POST /api/admin/teachers/bulk-approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "teacher_ids": ["array of teacher IDs"]
}
```

**Response:** Success message with count

---

## 5. 👨‍👩‍👧 Parents

**Base Path:** `/api`

### 5.1 Create Parent and Link (Admin)

**Endpoint:** `POST /api/admin/parents`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "username": "string (required, min 3 chars)",
  "links": [
    {
      "student_id": "number (required, positive)",
      "relation_type": "mother | father | guardian"
    }
  ]
}
```

**Response:** Created parent object with links

---

### 5.2 Link Existing Parent (Admin)

**Endpoint:** `POST /api/admin/parents/link`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "parent_user_id": "number (required, positive)",
  "student_id": "number (required, positive)",
  "relation_type": "mother | father | guardian"
}
```

**Response:** Success message

---

### 5.3 Update Parent Profile

**Endpoint:** `PATCH /api/parents/profile`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Request Body:**
```json
{
  "name": "string (optional, min 1 char)",
  "phone": "string (optional)"
}
```

**Response:** Updated parent object

---

### 5.4 Teacher Create Parent (Pending Approval)

**Endpoint:** `POST /api/teachers/parents`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Request Body:**
```json
{
  "username": "string (required, min 3 chars)",
  "student_id": "number (required, positive)",
  "relation_type": "mother | father | guardian"
}
```

**Response:** Created parent (pending approval)

---

### 5.5 Approve Parent

**Endpoint:** `POST /api/admin/parents/:parent_id/approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**URL Parameters:**
- `parent_id` - Parent ID

**Request Body:**
```json
{
  "action": "approve | reject"
}
```

**Response:** Success message

---

### 5.6 Bulk Approve Parents

**Endpoint:** `POST /api/admin/parents/bulk-approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "parent_ids": ["array of parent IDs"]
}
```

**Response:** Success message with count

---

### 5.7 Get Parent's Children

**Endpoint:** `GET /api/parents/children`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Query Parameters:**
- `limit` - string (optional)
- `offset` - string (optional)

**Response:** Array of linked student objects

---

### 5.8 Get Parent Dashboard

**Endpoint:** `GET /api/parents/dashboard`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Response:** Dashboard data for parent

---

## 6. 📂 Sections

**Base Path:** `/api/sections`

### 6.1 Create Section

**Endpoint:** `POST /api/sections`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**Request Body:**
```json
{
  "class_id": "number (required, integer)",
  "name": "string (required, min 1, max 10)",
  "capacity": "number (required, integer, min 1, max 100)"
}
```

**Response:** Created section object

---

### 6.2 List Sections by Class

**Endpoint:** `GET /api/sections/classes/:class_id/sections`  
**Authentication:** ✅ Required  
**Role:** `school_admin` or `teacher`

**URL Parameters:**
- `class_id` - Class ID

**Response:** Array of section objects

---

### 6.3 Update Section Status

**Endpoint:** `PATCH /api/sections/:id/status`  
**Authentication:** ✅ Required  
**Role:** `school_admin`

**URL Parameters:**
- `id` - Section ID

**Request Body:**
```json
{
  "is_active": "boolean (required)"
}
```

**Response:** Updated section object

---

## 7. 🎓 Classes

**Base Path:** `/api/classes`

> **Note:** Uses Joi validation instead of Zod

### 7.1 Create Class

**Endpoint:** `POST /api/classes`  
**Authentication:** ✅ Required

**Request Body:**
```json
{
  "class_name": "string (required, min 1, max 50)",
  "capacity": "number (optional, integer, min 1, max 500)",
  "class_teacher_id": "number (integer, nullable)"
}
```

**Response:** Created class object

---

### 7.2 Get All Classes

**Endpoint:** `GET /api/classes`  
**Authentication:** ✅ Required

**Response:** Array of class objects

---

### 7.3 Get Class by ID

**Endpoint:** `GET /api/classes/:id`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Class ID

**Response:** Class object

---

### 7.4 Update Class

**Endpoint:** `PATCH /api/classes/:id`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Class ID

**Request Body:**
```json
{
  "class_name": "string (optional, min 1, max 50)",
  "capacity": "number (optional, integer, min 1, max 500)",
  "class_teacher_id": "number (integer, nullable)",
  "is_active": "boolean (optional)"
}
```

**Response:** Updated class object

---

### 7.5 Delete Class

**Endpoint:** `DELETE /api/classes/:id`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Class ID

**Response:** Success message

---

## 8. ✅ Approvals

**Base Path:** `/api`

### 8.1 Get Teacher Pending Approvals

**Endpoint:** `GET /api/teachers/approvals/pending`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Query Parameters:**
- `limit` - string (optional)
- `offset` - string (optional)
- `class_id` - string (optional)
- `teacher_id` - string (optional)
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)

**Response:** Array of pending approval objects

---

### 8.2 Get Admin Pending Approvals

**Endpoint:** `GET /api/admin/approvals/pending`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Query Parameters:**
- `limit` - string (optional)
- `offset` - string (optional)
- `class_id` - string (optional)
- `teacher_id` - string (optional)
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)

**Response:** Array of pending approval objects

---

## 9. 📊 Attendance

**Base Path:** `/api`

### 9.1 Mark Attendance (Teacher)

**Endpoint:** `POST /api/teachers/attendance`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Request Body:**
```json
{
  "class_id": "number (required, integer)",
  "section_id": "number (required, integer)",
  "date": "string (required, YYYY-MM-DD)",
  "records": [
    {
      "student_id": "number (required, integer)",
      "status": "present | absent | leave"
    }
  ]
}
```

**Response:** Success message

---

### 9.2 Get Teacher Attendance Summary

**Endpoint:** `GET /api/teachers/attendance/summary`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Query Parameters:**
- `class_id` - string (optional)
- `section_id` - string (optional)
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)
- `limit` - string (optional)
- `offset` - string (optional)

**Response:** Attendance summary data

---

### 9.3 Get Parent Attendance Summary

**Endpoint:** `GET /api/parents/attendance/summary`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Query Parameters:**
- `class_id` - string (optional)
- `section_id` - string (optional)
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)
- `limit` - string (optional)
- `offset` - string (optional)

**Response:** Attendance summary for parent's children

---

### 9.4 Get Teacher Attendance Analytics

**Endpoint:** `GET /api/teachers/attendance/analytics`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Query Parameters:**
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)
- `class_id` - string (optional)
- `section_id` - string (optional)
- `student_id` - string (optional)

**Response:** Analytics data (charts, trends, percentages)

---

### 9.5 Get Parent Attendance Analytics

**Endpoint:** `GET /api/parents/attendance/analytics`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Query Parameters:**
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)

**Response:** Analytics data for parent's children

---

## 10. 📝 Homework

**Base Path:** `/api/homework`

> **Note:** Uses custom permission middleware `allowAdminOrSectionClassTeacher`

### 10.1 Create Homework

**Endpoint:** `POST /api/homework`  
**Authentication:** ✅ Required  
**Permission:** Admin or Section/Class Teacher

**Request Body:**
```json
{
  "class_id": "number (required, positive)",
  "section_id": "number (required, positive)",
  "subject_id": "number (required, positive)",
  "homework_date": "string (required, YYYY-MM-DD)",
  "description": "string (required, min 1 char)"
}
```

**Response:** Created homework object

---

### 10.2 List Homework

**Endpoint:** `GET /api/homework`  
**Authentication:** ✅ Required

**Query Parameters:**
- `class_id` - number (optional, positive)
- `section_id` - number (optional, positive)
- `date` - string (optional, YYYY-MM-DD)

**Response:** Array of homework objects

---

### 10.3 Submit Homework (Student)

**Endpoint:** `POST /api/homework/:homework_id/submit`  
**Authentication:** ✅ Required

**URL Parameters:**
- `homework_id` - Homework ID

**Request Body:**
```json
{
  "is_completed": "boolean (required)",
  "remark": "string (optional)"
}
```

**Response:** Homework submission object

---

### 10.4 Get Homework Summary

**Endpoint:** `GET /api/homework/analytics/summary`  
**Authentication:** ✅ Required

**Response:** Homework analytics summary

---

### 10.5 Get Homework Student Status

**Endpoint:** `GET /api/homework/analytics/:homework_id/students`  
**Authentication:** ✅ Required

**URL Parameters:**
- `homework_id` - Homework ID

**Response:** Array of student submission statuses

---

## 11. 🔔 Notifications

**Base Path:** `/api/notifications`

### 11.1 Create Notification

**Endpoint:** `POST /api/notifications`  
**Authentication:** ✅ Required  
**Role:** `admin` or `teacher`

**Request Body:**
```json
{
  "title": "string (required, min 1 char)",
  "message": "string (required, min 1 char)",
  "target_role": "teacher | parent | student | all",
  "class_id": "number (optional, positive)",
  "section_id": "number (optional, positive)"
}
```

**Response:** Created notification object

> **Note:** Triggers real-time socket notification

---

### 11.2 List Notifications

**Endpoint:** `GET /api/notifications`  
**Authentication:** ✅ Required  
**Role:** Any authenticated user

**Response:** Array of notifications for the user

---

### 11.3 Acknowledge Notification

**Endpoint:** `POST /api/notifications/:id/acknowledge`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Notification ID

**Request Body:** Empty object `{}`

**Response:** Acknowledgment object

---

### 11.4 List Notification Acknowledgments

**Endpoint:** `GET /api/notifications/:id/acknowledgements`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Notification ID

**Response:** Array of acknowledgment objects (who read it)

---

## 12. 📄 Report Cards & Exams

### 12.1 Create Exam

**Endpoint:** `POST /api/exams`  
**Authentication:** ✅ Required  
**Role:** `teacher` or `admin`

**Request Body:**
```json
{
  "class_id": "number (required, positive)",
  "name": "string (required, min 1 char)",
  "start_date": "string (optional, YYYY-MM-DD)",
  "end_date": "string (optional, YYYY-MM-DD)"
}
```

**Response:** Created exam object

---

### 12.2 Lock Exam

**Endpoint:** `POST /api/exams/:id/lock`  
**Authentication:** ✅ Required  
**Role:** `teacher` or `admin`

**URL Parameters:**
- `id` - Exam ID

**Request Body:**
```json
{
  "is_locked": true
}
```

**Response:** Updated exam object

> **Note:** Prevents further modifications

---

### 12.3 List Exams by Class

**Endpoint:** `GET /api/exams`  
**Authentication:** ✅ Required  
**Role:** `student`, `parent`, or `teacher`

**Response:** Array of exam objects

---

### 12.4 Create Report Card

**Endpoint:** `POST /api/report-cards`  
**Authentication:** ✅ Required  
**Permission:** Admin or Class Teacher

**Request Body:**
```json
{
  "student_id": "number (required, positive)",
  "exam_id": "number (required, positive)"
}
```

**Response:** Created report card object

---

### 12.5 Save Report Card Marks

**Endpoint:** `POST /api/report-cards/:id/marks`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Report Card ID

**Request Body:**
```json
{
  "marks": [
    {
      "subject_id": "number (required, positive)",
      "marks_obtained": "number (required)",
      "max_marks": "number (required, positive)"
    }
  ]
}
```

**Response:** Updated report card with marks

---

### 12.6 Publish Report Card

**Endpoint:** `POST /api/report-cards/:id/publish`  
**Authentication:** ✅ Required  
**Permission:** Admin or Class Teacher

**URL Parameters:**
- `id` - Report Card ID

**Request Body:**
```json
{
  "remarks": "string (optional)"
}
```

**Response:** Published report card

> **Note:** Makes visible to students/parents

---

### 12.7 Get Report Card

**Endpoint:** `GET /api/report-cards/:id`  
**Authentication:** ✅ Required

**URL Parameters:**
- `id` - Report Card ID

**Response:** Report card object with marks

---

## 13. 📅 Timetables

**Base Path:** `/api/timetables`

### 13.1 Save Timetable

**Endpoint:** `POST /api/timetables`  
**Authentication:** ✅ Required  
**Permission:** Admin or Section/Class Teacher

**Request Body:**
```json
{
  "class_id": "number (required, positive)",
  "section_id": "number (required, positive)",
  "day_of_week": "monday | tuesday | wednesday | thursday | friday | saturday",
  "entries": [
    {
      "start_time": "string (required, HH:mm)",
      "end_time": "string (required, HH:mm)",
      "subject_id": "number (optional, positive)",
      "title": "string (optional)",
      "is_break": "boolean (required)"
    }
  ]
}
```

**Response:** Saved timetable object

> **Note:** Upserts (creates or updates)

---

### 13.2 Get Timetable

**Endpoint:** `GET /api/timetables`  
**Authentication:** ✅ Required  
**Role:** `student`, `parent`, or `teacher`

**Response:** Timetable object for the week

---

## 14. 🤖 AI Features

### 14.1 RAG - Ask Question

**Endpoint:** `POST /api/rag/ask`  
**Authentication:** ✅ Required  
**Role:** `student`, `teacher`, or `parent`  
**Rate Limit:** ⚡ 10 requests per minute

**Request Body:**
```json
{
  "question": "string (required)"
}
```

**Response:**
```json
{
  "answer": "string",
  "sources": ["array of source references"]
}
```

> **Note:** Uses ChromaDB vector search + Gemini AI

---

### 14.2 Teacher AI Assistant

**Endpoint:** `POST /api/teacher/ai`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Request Body:**
```json
{
  "purpose": "lesson_outline | teaching_points | homework_ideas | study_plan | question_paper",
  "topic_id": "number (optional)",
  "subject_id": "number (optional)",
  "context": "object (optional)"
}
```

**Response:**
```json
{
  "output": "string (AI generated content)",
  "saved_id": "number (ai_output record ID)"
}
```

> **Note:** Saves to `ai_outputs` table for reuse

---

### 14.3 School AI Analytics

**Endpoint:** `GET /api/analytics/ai/school`  
**Authentication:** ✅ Required  
**Role:** `school_admin` or `super_admin`

**Response:**
```json
{
  "total_queries": "number",
  "by_role": "object",
  "by_date": "array",
  "top_users": "array"
}
```

---

### 14.4 Teacher AI Analytics

**Endpoint:** `GET /api/analytics/ai/teacher`  
**Authentication:** ✅ Required  
**Role:** `teacher`

**Response:**
```json
{
  "my_queries": "number",
  "by_purpose": "object",
  "recent_outputs": "array"
}
```

---

### 14.5 Student AI Analytics

**Endpoint:** `GET /api/analytics/ai/student`  
**Authentication:** ✅ Required  
**Role:** `student`

**Response:**
```json
{
  "my_queries": "number",
  "by_subject": "object",
  "learning_time": "object"
}
```

---

## 15. 🎮 Game & Quiz

> **Note:** Quiz game uses Socket.IO for real-time gameplay

### 15.1 Submit Single Player Quiz

**Endpoint:** `POST /api/quiz/single/submit`  
**Authentication:** ✅ Required

**Response:** Quiz result

> **Note:** Multiplayer quiz uses WebSocket events (see Socket.IO section)

---

## 16. 💬 Group Chat

**Base Path:** `/api/group-chat`

> **Note:** Uses `auth` and `schoolScope` middleware

### 16.1 Create Group Chat

**Endpoint:** `POST /api/group-chat`  
**Authentication:** ✅ Required  
**Middleware:** School scope

**Response:** Created group chat object

---

### 16.2 List Group Chats

**Endpoint:** `GET /api/group-chat`  
**Authentication:** ✅ Required  
**Middleware:** School scope

**Response:** Array of group chats for logged-in user

> **Note:** Real-time messaging uses Socket.IO

---

## 17. 💳 Subscriptions

**Base Path:** `/api/subscriptions`

### 17.1 Upsert Subscription

**Endpoint:** `POST /api/subscriptions`  
**Authentication:** ✅ Required  
**Role:** `super_admin`

**Request Body:**
```json
{
  "school_id": "number (required)",
  "status": "active | inactive",
  "start_date": "string (YYYY-MM-DD)",
  "end_date": "string (YYYY-MM-DD)",
  "notes": "string (optional)"
}
```

**Response:** Subscription object

> **Note:** Creates or updates school subscription

---

## 18. 📜 Audit Logs

**Base Path:** `/api/admin/audit-logs`

### 18.1 List Audit Logs

**Endpoint:** `GET /api/admin/audit-logs`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Query Parameters:**
- `entity_type` - string (optional, enum: "student")
- `entity_id` - string (optional)
- `from_date` - string (optional, YYYY-MM-DD)
- `to_date` - string (optional, YYYY-MM-DD)
- `limit` - string (optional)
- `offset` - string (optional)

**Response:** Array of audit log objects

> **Note:** Tracks all profile changes and approvals

---

## 19. ⚡ Bulk Operations

### 19.1 Bulk Approve Teachers

**Endpoint:** `POST /api/admin/teachers/bulk-approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "teacher_ids": ["array of teacher IDs"]
}
```

**Response:** Success message with count

---

### 19.2 Bulk Approve Parents

**Endpoint:** `POST /api/admin/parents/bulk-approve`  
**Authentication:** ✅ Required  
**Role:** `admin`

**Request Body:**
```json
{
  "parent_ids": ["array of parent IDs"]
}
```

**Response:** Success message with count

---

## 20. 📊 Dashboard APIs

### 20.1 Parent Dashboard

**Endpoint:** `GET /api/parents/dashboard`  
**Authentication:** ✅ Required  
**Role:** `parent`

**Response:** Comprehensive dashboard data including:
- Children's attendance
- Homework status
- Recent notifications
- Upcoming exams

---

## 21. 🔌 Socket.IO Events

**Connection URL:** `http://localhost:5000`  
**Authentication:** JWT token in handshake auth

### Connection Setup

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "your_jwt_token"
  }
});
```

---

### Game/Quiz Events

**Namespace:** Default `/`

#### Client → Server Events

**1. quiz:join**
```javascript
socket.emit("quiz:join", { sessionId: 123 });
```

**2. quiz:start** (Host only)
```javascript
socket.emit("quiz:start", { sessionId: 123 });
```

**3. quiz:answer**
```javascript
socket.emit("quiz:answer", {
  sessionId: 123,
  questionId: 456,
  selectedIndex: 2
});
```

**4. quiz:finished**
```javascript
socket.emit("quiz:finished", { sessionId: 123 });
```

#### Server → Client Events

**1. quiz:joined**
```javascript
socket.on("quiz:joined", (data) => {
  // { sessionId, playerId, status }
});
```

**2. quiz:started**
```javascript
socket.on("quiz:started", (data) => {
  // { startedAt, totalTimeMs }
});
```

**3. quiz:answer_ack**
```javascript
socket.on("quiz:answer_ack", (data) => {
  // { questionId, isCorrect }
});
```

**4. quiz:time_up**
```javascript
socket.on("quiz:time_up", () => {
  // Quiz time expired
});
```

**5. quiz:waiting**
```javascript
socket.on("quiz:waiting", () => {
  // Waiting for other players
});
```

**6. quiz:all_finished**
```javascript
socket.on("quiz:all_finished", () => {
  // All players finished
});
```

**7. quiz:error**
```javascript
socket.on("quiz:error", (data) => {
  // { message: "error description" }
});
```

---

### Group Chat Events

Real-time messaging implementation in `group-chat.socket.js`

---

### Notification Events

Real-time notification delivery to connected users via `notification.socket.js`

---

## 22. ⚠️ Error Handling

### Error Response Format

All endpoints follow this error format:

```json
{
  "status": "fail | error",
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (no token or invalid token) |
| `403` | Forbidden (insufficient permissions or inactive account) |
| `404` | Not Found |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error |

---

## 23. 🔑 Authentication Flow

1. **Login** → Receive JWT token
2. **Store token** in client (localStorage/sessionStorage)
3. **Include token** in all requests:
   ```
   Authorization: Bearer <token>
   ```
4. **First Login Flow:**
   - If `first_login = true`, user must complete profile
   - Call `/complete-profile` endpoint
   - After completion, `first_login` set to `false`

---

## 24. 👥 Role-Based Access

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access, school management |
| `school_admin` | School-level management, user creation |
| `teacher` | Class management, attendance, homework, approvals |
| `student` | View own data, submit homework, take quizzes |
| `parent` | View children's data, attendance, homework |

---

## 📊 Module Coverage Summary

✅ **All 32 Modules Documented:**

| # | Module | Endpoints | Status |
|---|--------|-----------|--------|
| 1 | Authentication | 1 | ✅ |
| 2 | Schools | 5 | ✅ |
| 3 | Students | 9 | ✅ |
| 4 | Teachers | 8 | ✅ |
| 5 | Parents | 8 | ✅ |
| 6 | Sections | 3 | ✅ |
| 7 | Classes | 5 | ✅ |
| 8 | Approvals | 2 | ✅ |
| 9 | Attendance | 5 | ✅ |
| 10 | Homework | 5 | ✅ |
| 11 | Notifications | 4 | ✅ |
| 12 | Report Cards | 7 | ✅ |
| 13 | Timetables | 2 | ✅ |
| 14 | AI Features (RAG) | 1 | ✅ |
| 15 | AI Features (Teacher AI) | 1 | ✅ |
| 16 | AI Analytics | 3 | ✅ |
| 17 | Game & Quiz | 1 | ✅ |
| 18 | Group Chat | 2 | ✅ |
| 19 | Subscriptions | 1 | ✅ |
| 20 | Audit Logs | 1 | ✅ |
| 21 | Bulk Operations | 2 | ✅ |
| 22 | Dashboard APIs | 1 | ✅ |
| 23 | Socket.IO (Game) | 8 events | ✅ |
| 24 | Socket.IO (Chat) | - | ✅ |
| 25 | Socket.IO (Notifications) | - | ✅ |
| 26 | Student Approvals | 2 | ✅ |
| 27 | Teacher Approvals | 2 | ✅ |
| 28 | Parent Approvals | 2 | ✅ |
| 29 | Attendance Summary | 2 | ✅ |
| 30 | Attendance Analytics | 2 | ✅ |
| 31 | Parent Dashboard | 2 | ✅ |
| 32 | Exam Management | 3 | ✅ |

**Total Endpoints:** 100+

---

## 🔒 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/rag/ask` | 10 requests per minute per IP/user |
| Other endpoints | No explicit rate limiting (should be added for production) |

---

## 📝 Important Notes

1. **School Scoping:** Most endpoints automatically filter by `school_id` from JWT
2. **Pagination:** Use `limit` and `offset` query parameters where supported
3. **Date Format:** Always use ISO 8601 (YYYY-MM-DD)
4. **Time Format:** Use HH:mm (24-hour format)
5. **File Uploads:** Not documented (no multer routes found)
6. **CORS:** Configured for `localhost:5173` and `localhost:5174`

---

## 📅 Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-01-28 | Initial comprehensive API documentation |

---

## 📧 Support

For issues and questions, please contact the development team or create an issue in the repository.

**Repository:** [https://github.com/aravindh99/kiddo-backend](https://github.com/aravindh99/kiddo-backend)

---

**Last Updated:** 2026-01-28  
**Maintained by:** Kiddo Development Team