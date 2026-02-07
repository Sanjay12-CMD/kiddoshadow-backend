Project Flow (End-to-End)

Overview
This document describes the end-to-end flows and key APIs for super admin, school admin, teachers, students, and parents. It also highlights gaps and fixes needed.

System Actors
- super_admin
- school_admin
- teacher
- student
- parent

Setup Flow (Super Admin)
1. Create super admin user (one time)
API: none
How: run `node src/scripts/createSuperAdmin.js` with `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` in backend `.env`.

2. Super admin logs in
API: `POST /api/auth/login`

3. Super admin creates a school and the school admin user
API: `POST /api/schools`
Response includes `school` and `admin` (school_admin user).

4. Activate the school
API: `PATCH /api/schools/:id/status` with `{ "status": "active" }`

5. Activate the school admin user (if needed)
API: `PATCH /api/schools/:id/admin-status` with `{ "is_active": true }`

School Admin Setup Flow
1. School admin logs in
API: `POST /api/auth/login`

2. Create core academic structure
API: `POST /api/classes`, `POST /api/sections`, `POST /api/subjects`

3. Create teachers
API: `POST /api/teachers`
Bulk: `POST /api/bulk/bulk-create` or `POST /api/bulk/create`

4. Create students
API: `POST /api/students`
Bulk: `POST /api/bulk/bulk-create` or `POST /api/bulk/create`

5. Create parents and link to students
API: `POST /api/parents/parents` (create + link)
API: `POST /api/parents/parents/link` (link existing parent user)

6. Approve teacher and parent accounts
API: `GET /api/admin/approvals/pending`
API: `POST /api/admin/approvals/:type/:id/:action`
Alt: `POST /api/admin/teachers/:teacher_id/approve`, `POST /api/admin/parents/:parent_id/approve`

7. Assign teachers to sections and set class teachers
API: `POST /api/teacher-assignments` with `is_class_teacher: true` for class teachers
API: `PATCH /api/teacher-assignments/:id` to toggle `is_class_teacher`

8. Create section timetables
API: `POST /api/timetables`
School admin can create for any section.

9. Create announcements and quizzes
API: `POST /api/notifications`
API: `POST /api/quiz`

Teacher Flow
1. Teacher logs in
API: `POST /api/auth/login`

2. Complete profile (first login)
API: `POST /api/teachers/complete-profile`

3. See teacher dashboard (all assigned sections)
API: `GET /api/teachers/dashboard`
Uses all active teacher assignments to compute classes, timetable, homework, and report card status.

4. View own assignments
API: `GET /api/teacher-assignments/teacher/:teacherId`
Teachers can call with any id, but backend uses `req.user.teacher_id`.

5. Class teacher manages their section timetable
API: `POST /api/timetables`
Server enforces class teacher permission for that section.

6. Create homework
API: `POST /api/homework`
Requires `teacher_assignment_id` (subject + section + teacher).

7. Review student profile updates (scoped to assigned sections)
API: `GET /api/teachers/approvals/pending`
API: `POST /api/teachers/approvals/:type/:id/:action`

8. Use teacher AI tools
API: `POST /api/teacher/ai`

Student Flow
1. Student logs in
API: `POST /api/auth/login`

2. Complete profile (first login)
API: `POST /api/students/complete-profile`

3. Request profile updates (teacher approval)
API: `PATCH /api/students/profile/request`

4. View dashboard, homework, timetable, notifications
API: `GET /api/students/dashboard`
API: `GET /api/homework`
API: `GET /api/timetables/section`
API: `GET /api/notifications`

5. Use AI and quizzes
API: `POST /api/rag/ask`
API: `POST /api/quiz/generate`
API: quiz game endpoints under `/api/game`

Parent Flow
1. Parent logs in
API: `POST /api/auth/login`

2. Update profile
API: `PATCH /api/parents/parents/profile`

3. See children, dashboard, homework, timetable, notifications
API: `GET /api/parents/children`
API: `GET /api/parents/dashboard`
API: `GET /api/homework`
API: `GET /api/timetables/section`
API: `GET /api/notifications`

Shared APIs (Admin + Teacher)
- Classes: `GET /api/classes`, `GET /api/classes/:id`
- Sections: `GET /api/sections/classes/:class_id/sections`
- Subjects: `GET /api/subjects`
- Timetable create: `POST /api/timetables` (teacher only if class teacher)
- Homework create and analytics: `POST /api/homework`, `GET /api/homework/analytics/summary`, `GET /api/homework/analytics/:homework_id/students`
- Exams and report cards: `POST /api/exams`, `POST /api/report-cards`, `POST /api/report-cards/:id/marks`, `POST /api/report-cards/:id/publish`
- Announcements: `POST /api/notifications`, `GET /api/notifications`

Shared APIs (Teacher + Student)
- Group chat: `POST /api/group-chat`, `GET /api/group-chat`, `GET /api/group-chat/:chatId/messages`
- Quiz and game: `POST /api/quiz/generate`, `/api/game/*`

Shared APIs (All Authenticated)
- Notifications list: `GET /api/notifications`
- Section timetable: `GET /api/timetables/section`

Notes and Fixes
1. Approval gating
Use PWA route gating to allow login + profile completion, but block all other pages until `approval_status` is approved (see `/approval-pending`).

2. Teacher approvals scope
Teacher approvals are now scoped to their assigned sections via `TeacherAssignment` (both list and action).

3. Teacher class teacher selection
Still admin-only. Add a teacher request endpoint if you want teachers to request class-teacher assignment.

4. Documentation alignment
Docs updated to reflect that `/teacher-assignments/section/:sectionId` allows class teachers, and timetables return grouped objects.

5. Teacher dashboard scope
Dashboard now includes all teacher assignments (not just class-teacher) so regular teachers see their schedule.
