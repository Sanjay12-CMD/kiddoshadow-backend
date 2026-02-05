# Kiddo Shadow - Complete API & Socket Reference

**Version:** 2.0  
**Last Updated:** February 5, 2026

---

## Table of Contents

### APIs
1. [Core APIs](#core-apis) - Auth, Schools, Teachers, Students, Parents, Classes, Sections, Subjects
2. [Teacher Planning & Tracking](#teacher-planning--tracking) - Assignments, Timetables, Sessions, Homework
3. [Communication](#communication) - Notifications, Group Chat
4. [Assessments](#assessments) - Quiz, Game
5. [Attendance & Analytics](#attendance--analytics)
6. [AI Features](#ai-features) - RAG, Teacher AI, Analytics
7. [Approvals & Audit](#approvals--audit)
8. [Dashboards](#dashboards)
9. [Subscriptions](#subscriptions)

### Socket Events
1. [Game/Quiz Socket](#gamequiz-socket)
2. [Group Chat Socket](#group-chat-socket)
3. [Notification Socket](#notification-socket)

---

## Core APIs

> **Note:** Core APIs (Auth, Teachers, Students, Parents, Classes, Sections, Subjects, Bulk Creation, Audit Logs) are documented in detail in [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)

**Quick Reference:**
- `/api/auth` - Authentication (login, register)
- `/api/schools` - School management
- `/api/teachers` - Teacher CRUD
- `/api/students` - Student CRUD
- `/api/parents` - Parent CRUD
- `/api/classes` - Class management
- `/api/sections` - Section management
- `/api/subjects` - Subject management
- `/api/bulk/bulk-create` - Bulk data creation
- `/api/audit/admin/audit-logs` - Audit logs

---

## Teacher Planning & Tracking

### Teacher Assignments
```http
POST /api/teacher-assignments
GET /api/teacher-assignments
GET /api/teacher-assignments/:id
PATCH /api/teacher-assignments/:id
DELETE /api/teacher-assignments/:id
```

**Purpose:** Assign teachers to subjects in specific sections

---

### Timetables
```http
POST /api/timetables
GET /api/timetables/section
GET /api/timetables/teacher/me
```

**Purpose:** Manage class timetables and view schedules

#### Create/Update Timetable
```http
POST /api/timetables
```

**Authorization:** Admin or Teacher  
**Description:** Create or update timetable for a section (replaces existing for that day)

**Request Body:**
```json
{
  "class_id": 5,
  "section_id": 12,
  "day_of_week": "monday",
  "entries": [
    {
      "start_time": "09:00",
      "end_time": "09:45",
      "teacher_assignment_id": 42,
      "is_break": false
    },
    {
      "start_time": "09:45",
      "end_time": "10:00",
      "title": "Short Break",
      "is_break": true
    },
    {
      "start_time": "10:00",
      "end_time": "10:45",
      "teacher_assignment_id": 43,
      "is_break": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timetable saved successfully"
}
```

**Permission Check:**
- Admin: Can create/update any timetable
- Teacher: Must be class teacher of the section

---

#### View Section Timetable
```http
GET /api/timetables/section?class_id=5&section_id=12
```

**Authorization:** Any authenticated user  
**Description:** View timetable for a specific section (grouped by day)

**Response:**
```json
{
  "success": true,
  "data": {
    "monday": [
      {
        "id": 1,
        "start_time": "09:00",
        "end_time": "09:45",
        "is_break": false,
        "title": null,
        "subject": {
          "id": 10,
          "name": "Mathematics"
        }
      },
      {
        "id": 2,
        "start_time": "09:45",
        "end_time": "10:00",
        "is_break": true,
        "title": "Short Break",
        "subject": null
      }
    ],
    "tuesday": [...],
    ...
  }
}
```

---

#### View Teacher's Own Timetable
```http
GET /api/timetables/teacher/me
```

**Authorization:** Teacher  
**Description:** View own teaching schedule (grouped by day)

**Response:**
```json
{
  "success": true,
  "data": {
    "monday": [
      {
        "id": 1,
        "start_time": "09:00",
        "end_time": "09:45",
        "class": {
          "id": 5,
          "class_name": "Class 10"
        },
        "section": {
          "id": 12,
          "name": "A"
        },
        "subject": {
          "id": 10,
          "name": "Mathematics"
        }
      }
    ],
    "tuesday": [...],
    ...
  }
}
```

---

### Teacher Class Sessions
```http
POST /api/teacher-class-sessions
GET /api/teacher-class-sessions
GET /api/teacher-class-sessions/:id
PATCH /api/teacher-class-sessions/:id
DELETE /api/teacher-class-sessions/:id
```

**Purpose:** Track individual class sessions conducted by teachers

---

### Homework
```http
POST /api/homework
GET /api/homework
GET /api/homework/:id
PATCH /api/homework/:id
DELETE /api/homework/:id
```

**Purpose:** Create and manage homework assignments

---

## Communication

### Notifications
```http
GET /api/notifications
POST /api/notifications
PATCH /api/notifications/:id/read
DELETE /api/notifications/:id
```

**Purpose:** Send and manage in-app notifications

**Real-time:** Uses Socket.IO for instant delivery

---

### Group Chat
```http
POST /api/group-chat
GET /api/group-chat
GET /api/group-chat/:id
GET /api/group-chat/:id/messages
POST /api/group-chat/:id/members
DELETE /api/group-chat/:id/members/:userId
```

**Purpose:** Create and manage group chats (class groups, teacher groups, etc.)

**Real-time:** Uses Socket.IO for instant messaging

---

## Assessments

### Quiz/Game
```http
POST /api/game/sessions
GET /api/game/sessions
GET /api/game/sessions/:id
POST /api/game/sessions/:id/join
GET /api/game/sessions/:id/results
```

**Purpose:** Create and manage quiz/game sessions for students

**Real-time:** Uses Socket.IO for live quiz gameplay

---

## Attendance & Analytics

### Attendance Summary
```http
GET /api/attendance/summary
GET /api/attendance/summary/:studentId
POST /api/attendance/mark
```

**Purpose:** Mark and view attendance

---

### Attendance Analytics
```http
GET /api/attendance/analytics
GET /api/attendance/analytics/class/:classId
GET /api/attendance/analytics/student/:studentId
```

**Purpose:** Analyze attendance patterns and trends

---

## AI Features

### RAG (Retrieval-Augmented Generation)
```http
POST /api/rag/query
POST /api/rag/index
GET /api/rag/documents
DELETE /api/rag/documents/:id
```

**Purpose:** AI-powered question answering using school content

---

### Teacher AI
```http
POST /api/teacher-ai/generate-lesson
POST /api/teacher-ai/generate-quiz
POST /api/teacher-ai/explain-concept
```

**Purpose:** AI assistance for teachers (lesson planning, quiz generation, etc.)

---

### AI Analytics
```http
GET /api/ai-analytics/usage
GET /api/ai-analytics/teacher/:teacherId
GET /api/ai-analytics/student/:studentId
```

**Purpose:** Track AI feature usage and effectiveness

---

## Approvals & Audit

### Approvals
```http
GET /api/approvals
GET /api/approvals/pending
PATCH /api/approvals/:id/approve
PATCH /api/approvals/:id/reject
```

**Purpose:** Manage approval workflows for teachers, students, parents

**Specific Approval Routes:**
- `/api/teachers/approvals` - Teacher approvals
- `/api/students/approvals` - Student approvals
- `/api/parents/approvals` - Parent approvals

---

### Audit Logs
```http
GET /api/audit/admin/audit-logs
```

**Purpose:** Track all system changes and user actions

**Response:**
```json
{
  "total": 500,
  "items": [
    {
      "id": 1,
      "user_id": 10,
      "action": "CREATE_TEACHER",
      "entity_type": "teacher",
      "entity_id": 15,
      "changes": {},
      "created_at": "2026-02-05T10:00:00Z"
    }
  ]
}
```

---

## Dashboards

### Parent Dashboard
```http
GET /api/parents/dashboard
```

**Returns:** Student info, attendance, grades, notifications

---

### Student Dashboard
```http
GET /api/students/dashboard
```

**Returns:** Classes, homework, grades, attendance

---

### Teacher Dashboard
```http
GET /api/teachers/dashboard
```

**Returns:** Assigned classes, upcoming sessions, pending tasks

---

## Subscriptions

```http
POST /api/subscriptions
GET /api/subscriptions
GET /api/subscriptions/:id
PATCH /api/subscriptions/:id
DELETE /api/subscriptions/:id
```

**Purpose:** Manage school subscriptions and billing

---

## Socket Events

### Connection Setup

All socket connections require JWT authentication:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002", {
  auth: {
    token: "your_jwt_token_here"
  }
});
```

---

## Game/Quiz Socket

**Namespace:** Default (`/`)  
**Room Pattern:** `quiz:{sessionId}`

### Client → Server Events

#### 1. Join Quiz
```javascript
socket.emit("quiz:join", { sessionId: 42 });
```

**Response:**
```javascript
socket.on("quiz:joined", (data) => {
  // data: { sessionId, playerId, status, isHost }
});

socket.on("quiz:error", (data) => {
  // data: { message }
});
```

---

#### 2. Start Quiz (Host Only)
```javascript
socket.emit("quiz:start", { sessionId: 42 });
```

**Broadcast to Room:**
```javascript
socket.on("quiz:started", (data) => {
  // data: { startedAt, totalTimeMs }
});
```

---

#### 3. Submit Answer
```javascript
socket.emit("quiz:answer", {
  sessionId: 42,
  questionId: 10,
  selectedIndex: 2
});
```

**Response:**
```javascript
socket.on("quiz:answer_ack", (data) => {
  // data: { questionId, isCorrect }
});
```

---

#### 4. Finish Quiz
```javascript
socket.emit("quiz:finished", { sessionId: 42 });
```

**Broadcast to Room:**
```javascript
socket.on("quiz:waiting", () => {
  // Some players still playing
});

socket.on("quiz:all_finished", () => {
  // All players finished
});
```

---

### Server → Client Events

#### Time Up
```javascript
socket.on("quiz:time_up", () => {
  // Quiz time expired
});
```

---

## Group Chat Socket

**Namespace:** Default (`/`)  
**Room Pattern:** `group:{chatId}`

### Client → Server Events

#### 1. Join Group
```javascript
socket.emit("group:join", { chatId: 5 });
```

**Response:**
```javascript
socket.on("group:joined", (data) => {
  // data: { chatId }
});

socket.on("group:error", (data) => {
  // data: { message }
});
```

---

#### 2. Send Message
```javascript
socket.emit("group:message", {
  chatId: 5,
  type: "text", // or "image"
  text: "Hello everyone!",
  imageUrl: null // or URL for images
});
```

**Broadcast to Room:**
```javascript
socket.on("group:message:new", (data) => {
  // data: { id, chatId, senderUserId, type, text, imageUrl, createdAt }
});
```

---

#### 3. Leave Group
```javascript
socket.emit("group:leave", { chatId: 5 });
```

---

## Notification Socket

**Namespace:** Default (`/`)  
**Room Pattern:** `school:{schoolId}`

### Auto-Join on Connection

When a user connects, they automatically join their school's notification room:

```javascript
socket.on("notification:connected", (data) => {
  // data: { school_id }
});
```

### Server → Client Events

Notifications are broadcast to the school room from the server:

```javascript
// Server-side (from notification service)
io.to(`school:${schoolId}`).emit("notification:new", {
  id: 123,
  title: "New Homework",
  message: "Math homework assigned",
  type: "homework",
  created_at: "2026-02-05T10:00:00Z"
});
```

**Client receives:**
```javascript
socket.on("notification:new", (data) => {
  // data: { id, title, message, type, created_at }
  // Display notification to user
});
```

---

## Authentication Flow

All socket connections use JWT authentication:

1. User logs in via `/api/auth/login`
2. Receives JWT token
3. Connects to socket with token in `auth` object
4. Socket middleware verifies token
5. Attaches `socket.user` with `{ id, role, school_id }`

**Example:**
```javascript
const token = localStorage.getItem("token");

const socket = io("http://localhost:3002", {
  auth: { token }
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
  // Likely "No token" or "Unauthorized"
});
```

---

## Error Handling

### Socket Errors

All socket modules emit errors in a consistent format:

```javascript
socket.on("quiz:error", (data) => {
  console.error(data.message);
});

socket.on("group:error", (data) => {
  console.error(data.message);
});
```

**Common Error Messages:**
- `"No token"` - Missing JWT in connection
- `"Unauthorized"` - Invalid JWT
- `"Not registered for this quiz"` - User not a player
- `"You are not a member of this group"` - Not a group member
- `"Time is over"` - Quiz time expired
- `"Already answered"` - Duplicate answer submission

---

## Response Format Standards

### List Endpoints
All list endpoints return:
```json
{
  "total": <number>,
  "items": <array>
}
```

### Error Responses
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

---

## Unused Modules

The following folders contain only database models with no active routes/controllers/services:

- `student-content/` - Model only, no API implementation
- `teacher-content/` - Model only, no API implementation

**Recommendation:** These can be safely deleted if not planned for future use, or implement full CRUD APIs if needed.

---

## Notes

### Auto-Generated Usernames
- **Teachers:** `TCH-{school_id}-{serial}`
- **Students:** `STU-{school_id}-{section_id}-{serial}`
- **Parents:** `PAR-{school_id}-{student_id}`

### Default Passwords
All auto-generated accounts use: `{username}@123`

### Real-time Features
- **Quiz/Game:** Live gameplay with instant scoring
- **Group Chat:** Instant messaging
- **Notifications:** Real-time push notifications

---

**End of Documentation**
