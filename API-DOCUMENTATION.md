# Kiddo Shadow Backend API Documentation

**Version:** 2.0  
**Base URL:** `/api`  
**Last Updated:** February 5, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Teachers](#teachers)
3. [Students](#students)
4. [Parents](#parents)
5. [Classes](#classes)
6. [Sections](#sections)
7. [Subjects](#subjects)
8. [Teacher Assignments](#teacher-assignments)
9. [Bulk Creation](#bulk-creation)
10. [Audit Logs](#audit-logs)

---

## Authentication

All endpoints (except login/register) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin123",
    "role": "school_admin",
    "school_id": 1,
    "first_login": false
  }
}
```

---

## Teachers

### Create Teacher
```http
POST /api/teachers
```

**Authorization:** School Admin  
**Description:** Creates a single teacher with auto-generated username

**Request Body:** None required

**Response:**
```json
{
  "teacher_id": 15,
  "username": "TCH-1-015",
  "employee_id": "EMP-TCH-1-015",
  "password_hint": "username@123"
}
```

**Username Format:** `TCH-{school_id}-{serial}`  
**Password:** `{username}@123`

---

### List Teachers
```http
GET /api/teachers?page=1&limit=10
```

**Authorization:** School Admin

**Response:**
```json
{
  "total": 25,
  "items": [
    {
      "id": 1,
      "employee_id": "EMP-TCH-1-001",
      "gender": "male",
      "designation": "Senior Teacher",
      "qualification": "M.Ed",
      "experience": 5,
      "approval_status": "approved",
      "user": {
        "id": 10,
        "username": "TCH-1-001",
        "name": "John Doe",
        "is_active": true
      }
    }
  ]
}
```

---

### Update Teacher Status
```http
PATCH /api/teachers/:id/status
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "is_active": false
}
```

---

### Complete Teacher Profile
```http
POST /api/teachers/complete-profile
```

**Authorization:** Teacher (self)

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "gender": "male",
  "designation": "Senior Teacher",
  "qualification": "M.Ed",
  "experience": 5
}
```

**Response:**
```json
{
  "message": "Profile completed",
  "token": "new_jwt_token",
  "user": {
    "id": 10,
    "name": "John Doe",
    "first_login": false
  }
}
```

---

### Get My Profile
```http
GET /api/teachers/me
```

**Authorization:** Teacher (self)

---

## Students

### Create Student
```http
POST /api/students
```

**Authorization:** School Admin  
**Description:** Creates a single student with auto-generated username

**Request Body:**
```json
{
  "class_id": 5,
  "section_id": 12
}
```

**Response:**
```json
{
  "student_id": 42,
  "username": "STU-1-12-042",
  "class_id": 5,
  "section_id": 12,
  "password_hint": "username@123"
}
```

**Username Format:** `STU-{school_id}-{section_id}-{serial}`  
**Password:** `{username}@123`

---

### List Students
```http
GET /api/students?page=1&limit=10
```

**Authorization:** School Admin

**Response:**
```json
{
  "total": 150,
  "items": [
    {
      "id": 1,
      "admission_no": "ADM-STU-1-12-001",
      "roll_no": "001",
      "approval_status": "approved",
      "is_active": true,
      "user": {
        "id": 50,
        "username": "STU-1-12-001",
        "name": "Jane Smith"
      },
      "class": {
        "id": 5,
        "class_name": "Class 10"
      },
      "section": {
        "id": 12,
        "name": "A"
      }
    }
  ]
}
```

---

### Move Student
```http
PATCH /api/students/:id/move
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "section_id": 13
}
```

---

### Update Student Status
```http
PATCH /api/students/:id/status
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "is_active": false
}
```

---

### Complete Student Profile
```http
POST /api/students/complete-profile
```

**Authorization:** Student (self)

**Request Body:**
```json
{
  "name": "Jane Smith",
  "phone": "9876543210",
  "email": "jane@example.com",
  "gender": "female",
  "date_of_birth": "2010-05-15",
  "blood_group": "O+"
}
```

---

### Get My Profile
```http
GET /api/students/me
```

**Authorization:** Student (self)

---

### Assign Students to Section
```http
POST /api/students/assign-section
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "target_class_id": 5,
  "target_section_id": 12,
  "students": [
    {
      "student_id": 1,
      "roll_no": "001"
    }
  ]
}
```

---

## Parents

### Create Parent and Link
```http
POST /api/parents
```

**Authorization:** Admin  
**Description:** Creates a parent user with auto-generated username and links to a student

**Request Body:**
```json
{
  "student_id": 42,
  "relation_type": "father"
}
```

**Response:**
```json
{
  "parent_id": 26,
  "username": "PAR-1-42",
  "student_id": 42,
  "relation_type": "father",
  "password_hint": "username@123"
}
```

**Username Format:** `PAR-{school_id}-{student_id}`  
**Password:** `{username}@123`  
**Relation Types:** `mother`, `father`, `guardian` (default: `guardian`)

---

### Link Existing Parent
```http
POST /api/parents/link
```

**Authorization:** Admin  
**Description:** Link an existing parent user to another student

**Request Body:**
```json
{
  "parent_user_id": 100,
  "student_id": 44,
  "relation_type": "father"
}
```

**Response:**
```json
{
  "parent_user_id": 100,
  "student_id": 44
}
```

---

### Update Parent Profile
```http
PATCH /api/parents/profile
```

**Authorization:** Parent (self)

**Request Body:**
```json
{
  "name": "Robert Smith",
  "phone": "5551234567"
}
```

**Response:**
```json
{
  "message": "Profile updated",
  "token": "new_jwt_token",
  "user": {
    "id": 100,
    "name": "Robert Smith",
    "first_login": false
  }
}
```

---

### Get My Profile
```http
GET /api/parents/profile
```

**Authorization:** Parent (self)

**Response:**
```json
{
  "id": 100,
  "username": "PAR-1-42",
  "name": "Robert Smith",
  "phone": "5551234567",
  "role": "parent",
  "school_id": 1
}
```

---

## Classes

### Create Class
```http
POST /api/classes
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "class_name": "Class 10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "school_id": 1,
    "class_name": "Class 10"
  }
}
```

---

### List Classes
```http
GET /api/classes
```

**Authorization:** School Admin

**Response:**
```json
{
  "total": 5,
  "items": [
    {
      "id": 5,
      "class_name": "Class 10",
      "sections": [
        {
          "id": 12,
          "name": "A",
          "is_active": true
        },
        {
          "id": 13,
          "name": "B",
          "is_active": true
        }
      ]
    }
  ]
}
```

---

### Get Class by ID
```http
GET /api/classes/:id
```

**Authorization:** School Admin

---

### Update Class
```http
PATCH /api/classes/:id
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "class_name": "Class 10-A"
}
```

---

### Delete Class
```http
DELETE /api/classes/:id
```

**Authorization:** School Admin

---

## Sections

### Create Section
```http
POST /api/sections
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "class_id": 5,
  "name": "C"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "school_id": 1,
    "class_id": 5,
    "name": "C",
    "is_active": true
  }
}
```

---

### List Sections by Class
```http
GET /api/sections/classes/:class_id/sections
```

**Authorization:** School Admin, Teacher

**Response:**
```json
{
  "total": 3,
  "items": [
    {
      "id": 12,
      "class_id": 5,
      "name": "A",
      "is_active": true
    },
    {
      "id": 13,
      "class_id": 5,
      "name": "B",
      "is_active": true
    }
  ]
}
```

---

### Update Section Status
```http
PATCH /api/sections/:id/status
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "is_active": false
}
```

---

## Subjects

### Create Subject
```http
POST /api/subjects
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "category": "theory"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "school_id": 1,
    "name": "Mathematics",
    "code": "MATH101",
    "category": "theory"
  }
}
```

**Categories:** `theory`, `practical`, `both`

---

### List Subjects
```http
GET /api/subjects
```

**Authorization:** School Admin

**Response:**
```json
{
  "total": 8,
  "items": [
    {
      "id": 8,
      "name": "Mathematics",
      "code": "MATH101",
      "category": "theory"
    },
    {
      "id": 9,
      "name": "Physics",
      "code": "PHY101",
      "category": "practical"
    }
  ]
}
```

---

### Update Subject
```http
PATCH /api/subjects/:id
```

**Authorization:** School Admin

**Request Body:**
```json
{
  "name": "Advanced Mathematics",
  "code": "MATH201",
  "category": "both"
}
```

---

### Delete Subject
```http
DELETE /api/subjects/:id
```

**Authorization:** School Admin

---

## Teacher Assignments

### Assign Teacher
```http
POST /api/teacher-assignments
```

**Authorization:** School Admin  
**Description:** Assign a teacher to teach a subject in a specific section

**Request Body:**
```json
{
  "teacher_id": 15,
  "class_id": 5,
  "section_id": 12,
  "subject_id": 8
}
```

**Response:**
```json
{
  "id": 42,
  "school_id": 1,
  "teacher_id": 15,
  "section_id": 12,
  "subject_id": 8,
  "is_active": true
}
```

---

## Bulk Creation

### Bulk Create Data
```http
POST /api/bulk/bulk-create
```

**Authorization:** School Admin  
**Description:** Creates classes, sections, teachers, students, and parents in bulk

**Request Body:**
```json
{
  "classes": [
    {
      "name": "Class 9",
      "sections": [
        { "name": "A", "students": 30 },
        { "name": "B", "students": 25 }
      ]
    }
  ],
  "teacher_count": 15,
  "students_per_section": 30
}
```

**Response:**
```json
{
  "school_id": 1,
  "teachers": [
    {
      "teacher_id": 1,
      "username": "TCH-1-001"
    }
  ],
  "students": [
    {
      "student_id": 1,
      "username": "STU-1-12-001",
      "class": "Class 9",
      "section": "A"
    }
  ],
  "parents": [
    {
      "parent_id": 1,
      "username": "PAR-1-1",
      "student_id": 1
    }
  ],
  "summary": {
    "classes_created": 1,
    "teachers_created": 15,
    "students_created": 55
  }
}
```

**Username Patterns:**
- Teachers: `TCH-{school_id}-{serial}`
- Students: `STU-{school_id}-{section_id}-{serial}`
- Parents: `PAR-{school_id}-{student_id}`

**Default Password:** `{username}@123`

---

## Audit Logs

### List Audit Logs
```http
GET /api/audit/admin/audit-logs?page=1&limit=20
```

**Authorization:** Admin

**Response:**
```json
{
  "total": 500,
  "items": [
    {
      "id": 1,
      "school_id": 1,
      "user_id": 10,
      "action": "CREATE_TEACHER",
      "entity_type": "teacher",
      "entity_id": 15,
      "changes": {
        "username": "TCH-1-015"
      },
      "created_at": "2026-02-05T10:00:00Z"
    }
  ]
}
```

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
  "message": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Notes

### Auto-Generated Usernames
- **Teachers:** `TCH-{school_id}-{serial}`
- **Students:** `STU-{school_id}-{section_id}-{serial}`
- **Parents:** `PAR-{school_id}-{student_id}` (for bulk creation)

### Default Passwords
All auto-generated accounts use: `{username}@123`

### Profile Completion Flow
1. Admin creates user with auto-generated credentials
2. User logs in (first_login = true)
3. User completes profile via `/complete-profile` endpoint
4. Profile completion sets `first_login = false`
5. New JWT token issued with updated info

---

**End of Documentation**
