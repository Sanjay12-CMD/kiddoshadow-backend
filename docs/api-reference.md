# Kiddo Backend API (Feb 6, 2026)

Base URL: `/api` unless noted. Auth: Bearer JWT from `/auth/login`. `school_id` is enforced server-side from `req.user`.

## Quick Endpoint Details (route, payload, response)

- **Auth**
  - POST `/auth/login` — Body `{ username, password }` → `{ token }`
  - POST `/auth/change-password` — Body `{ old_password, new_password }` → `{ message }`

- **Schools (super_admin)**
  - POST `/schools` — `{ name, code, cbse_affiliation_no, address, city, state, zip, email, admin_username, admin_password }` → `{ school, admin:{ username } }`
  - GET `/schools` — Query `{ limit?, offset? }` → `{ count, rows }`
  - PATCH `/schools/:id/status` — `{ status }` → `{ message, school }`
  - PATCH `/schools/:id/admin-status` — `{ is_active }` → `{ message, admin }`
  - PATCH `/schools/:id/admin-reset-password` — `{ new_password }` → `{ message, admin }`

- **Classes**
  - POST `/classes` — `{ class_name, class_teacher_id? }` → `{ success, data }`
  - GET `/classes` — → `{ total, items }`
  - GET `/classes/:id` — → `{ success, data }`
  - PATCH `/classes/:id` — `{ class_name?, is_active?, class_teacher_id? }` → `{ success, data }`
  - DELETE `/classes/:id` — → `{ success, message }`

- **Sections**
  - POST `/sections` — `{ class_id, name }` → `{ success, data }`
  - GET `/sections/classes/:class_id/sections` — → `{ total, items }`
  - PATCH `/sections/:id/status` — `{ is_active }` → `{ success, data }`

- **Subjects**
  - POST `/subjects` — `{ name }` → `{ success, data }`
  - GET `/subjects` — → `{ success, data }`
  - PATCH `/subjects/:id` — `{ name }` → `{ success, data }`
  - DELETE `/subjects/:id` — → `{ success, message }`

- **Students**
  - POST `/students` — `{ class_id, section_id }` → `{ created, students }`
  - GET `/students` — Query pagination → `{ total, items }`
  - PATCH `/students/:id/move` — `{ section_id }` → `{ message, student }`
  - PATCH `/students/:id/status` — `{ is_active }` → `{ message, student }`
  - POST `/students/assign-section` — `{ target_class_id, target_section_id, students:[{ student_id, roll_no }] }` → `{ success, message }`
  - POST `/students/complete-profile` — profile fields → `{ message, token, user }`
  - GET `/students/me` — → `Student + class/section`
  - GET `/students/dashboard` — → `{ success, data }`

- **Teachers**
  - POST `/teachers` — `{ username, password }` → `{ teacher_id, username, employee_id, password_hint }`
  - GET `/teachers` — pagination → `{ total, items }`
  - PATCH `/teachers/:id/status` — `{ is_active }` → `{ message, teacher }`
  - POST `/teachers/complete-profile` — profile fields → `{ message, token, user }`
  - GET `/teachers/me` — → `Teacher with user`
  - GET `/teachers/dashboard` — → `{ success, data }`

- **Parents**
  - POST `/parents/parents` — `{ student_id, relation_type }` → `{ parent_user_id, student_id }`
  - POST `/parents/parents/link` — `{ parent_user_id, student_id, relation_type }` → `{ parent_user_id, student_id }`
  - PATCH `/parents/parents/profile` — `{ name?, phone? }` → `{ message, token, user }`
  - GET `/parents/parents/profile` — → `req.user`
  - GET `/parents/parents/children` — pagination → `{ success, total, data:[{ relation_type, student }] }`
  - GET `/parents/parents/dashboard` — → `{ success, data }`

- **Approvals**
  - GET `/teachers/approvals/pending` — query filters → `{ total, items }`
  - POST `/teachers/approvals/:type/:id/:action` — `{ rejection_reason? }` → `{ message, result }`
  - GET `/admin/approvals/pending` — → `{ teachers:{ total, items }, parents:{ total, items } }`
  - POST `/admin/approvals/:type/:id/:action` — `{ rejection_reason? }` → `{ message, result }`
  - Teacher profile: PATCH `/teachers/profile/request` → `{ message }`; POST `/admin/teachers/:teacher_id/approve` → `{ teacher_id, status }`
  - Student profile: PATCH `/students/profile/request` → `{ message }`; POST `/teachers/students/:student_id/approve` → `{ student_id, status }`
  - Parent approval: POST `/teachers/parents` → `{ parent_id, message }`; POST `/admin/parents/:parent_id/approve` → `{ parent_id, status }`
  - Bulk approvals: POST `/admin/teachers/bulk-approve` or `/admin/parents/bulk-approve` — `{ ids, action }` → `{ processed }`

- **Teacher Assignments (school_admin)**
  - POST `/teacher-assignments` — `{ teacher_id, class_id, section_id, subject_id, is_class_teacher? }` → `{ success, data }`
  - GET `/teacher-assignments` — pagination → `{ success, total, items }`
  - GET `/teacher-assignments/teacher/:teacherId` — → `{ success, data }`
  - GET `/teacher-assignments/section/:sectionId` — → `{ success, data }`
  - PATCH `/teacher-assignments/:id` — `{ is_active?, is_class_teacher? }` → `{ success, data }`
  - DELETE `/teacher-assignments/:id` — → `{ success, message }`

- **Timetables**
  - POST `/timetables` — `{ class_id, section_id, day_of_week, entries:[{ start_time,end_time,is_break,title?,teacher_assignment_id? }] }` → `{ success, message }`
  - GET `/timetables/section` — Query `{ class_id, section_id }` → `{ success, data }`
  - GET `/timetables/teacher/me` — → `{ success, data }`

- **Attendance**
  - POST `/teachers/attendance` — `{ teacher_class_session_id, records:[{ student_id, status }] }` → `{ success, message }`
  - GET `/teachers/attendance/summary` — filters → `{ total, items }`
  - GET `/parents/attendance/summary` — → `{ total, items }`
  - GET `/students/attendance/summary` — → `{ total, items }`
  - GET `/teachers/attendance/analytics` — → `{ items }`
  - GET `/parents/attendance/analytics` — → `{ items }`

- **Teacher Class Sessions**
  - POST `/teacher-class-sessions/start` — `{ teacher_assignment_id, timetable_id? }` → `{ success, data }`
  - POST `/teacher-class-sessions/:id/end` — → `{ success, data }`

- **Homework**
  - POST `/homework` — `{ class_id, section_id, teacher_assignment_id, homework_date, description }` → `{ success, data }`
  - GET `/homework` — filters → `{ success, total, items }`
  - POST `/homework/:homework_id/submit` — `{ is_completed, remark? }` → `{ success, data }`
  - GET `/homework/analytics/summary` — → `{ success, data }`
  - GET `/homework/analytics/:homework_id/students` — → `{ success, data }`

- **Notifications**
  - POST `/notifications` — `{ title, message, target_role, class_id?, section_id? }` → `{ success, data }`
  - GET `/notifications` — auto-filtered → `{ success, total, items }`
  - POST `/notifications/:id/acknowledge` — → `{ success, message }`
  - GET `/notifications/:id/acknowledgements` — → `{ success, data }`

- **Group Chat**
  - POST `/group-chat` — `{ subjectId, sectionId }` → `{ chatId }`
  - GET `/group-chat` — → `[ { chatId, role, subject, class, section, created_at } ]`
  - GET `/group-chat/:chatId/messages` — → `[ { id, sender_id, sender_name, avatar, content, type, created_at } ]`

- **AI & RAG**
  - POST `/rag/ask` — `{ question, classLevel? }` (+ `voice=true` for audio) → `{ question, answer, sources }` or wav stream
  - POST `/teacher/ai` — `{ aiType, payload }` → `{ aiType, result }`
  - GET `/analytics/ai/school` — → analytics object
  - GET `/analytics/ai/teacher` — → analytics object
  - GET `/analytics/ai/student` — → analytics object

- **Report Cards & Exams**
  - POST `/report-cards` — `{ student_id, exam_id }` → `{ success, data }`
  - POST `/report-cards/:id/marks` — `{ marks:[{ subject_id, marks_obtained, max_marks }] }` → `{ success, message }`
  - POST `/report-cards/:id/publish` — `{ remarks? }` → `{ success, data }`
  - GET `/report-cards/student/list` — → `{ success, data }`
  - GET `/report-cards/:id` — → `{ success, data }`
  - POST `/exams` — `{ class_id, name, start_date, end_date }` → `{ success, data }`
  - POST `/exams/:id/lock` — `{}` → `{ success, data }`
  - GET `/exams` — query `{ class_id, limit?, offset? }` → `{ success, total, items }`

- **Bulk (school_admin)**
  - POST `/bulk/bulk-create` or `/bulk/create` — `{ classes, teacher_count?, students_per_section? }` → seeded data summary
  - POST `/admin/teachers/bulk-approve` — `{ teacher_ids, action }` → `{ processed }`
  - POST `/admin/parents/bulk-approve` — `{ parent_ids, action }` → `{ processed }`

- **Subscriptions (super_admin)**
  - POST `/subscriptions` — `{ schoolId, status, startDate?, endDate?, notes? }` → `{ message, subscription }`

- **Game**
  - POST `/game/quiz/single/start` — `{ quizId, timeLimitMinutes }` → `{ sessionId, playerId }`
  - POST `/game/quiz/single/submit` — `{ playerId, answers:[{ questionId, selectedIndex }] }` → `{ score, total }`
  - GET `/game/quiz/:sessionId/leaderboard` — → leaderboard array
  - POST `/game/quiz/multi/join` — `{ roomCode }` → `{ sessionId, playerId }`

- **Dashboards**
  - GET `/teachers/dashboard` — → `{ success, data }` (classes, timetable, homework_summary, pending_report_cards)
  - GET `/students/dashboard` — → `{ success, data }`
  - GET `/parents/parents/dashboard` — → `{ success, data }`

## Schools (super_admin)
- `POST /schools` create school+admin — body `{ name, code, cbse_affiliation_no, address, city, state, zip, email, admin_username, admin_password }`
- `GET /schools` list — query `{ limit?, offset? }`
- `PATCH /schools/:id/status` — body `{ status: pending|active|suspended|expired }`
- `PATCH /schools/:id/admin-status` — body `{ is_active }`
- `PATCH /schools/:id/admin-reset-password` — body `{ new_password }`

## Classes & Sections
- `POST /classes` (school_admin) — `{ class_name, class_teacher_id? }`
- `GET /classes` (school_admin|teacher)
- `GET /classes/:id` (school_admin|teacher)
- `PATCH /classes/:id` (school_admin) — `{ class_name?, is_active?, class_teacher_id? }`
- `DELETE /classes/:id` (school_admin)
- `POST /sections` (school_admin) — `{ class_id, name }`
- `GET /sections/classes/:class_id/sections` (school_admin|teacher)
- `PATCH /sections/:id/status` (school_admin) — `{ is_active }`

## Subjects (school_admin)
- `POST /subjects` — `{ name }`
- `GET /subjects`
- `PATCH /subjects/:id` — `{ name }`
- `DELETE /subjects/:id`

## Students
- `POST /students` (school_admin) — `{ class_id, section_id }` auto-creates login
- `GET /students` (school_admin) — pagination via query
- `PATCH /students/:id/move` (school_admin) — `{ section_id }`
- `PATCH /students/:id/status` (school_admin) — `{ is_active }`
- `POST /students/assign-section` (school_admin) — `{ target_class_id, target_section_id, students:[{ student_id, roll_no }] }`
- `POST /students/complete-profile` (student) — profile fields
- `GET /students/me` (student)
- `GET /students/dashboard` (student) — attendance %, tokens mock, etc.

## Teachers
- `POST /teachers` (school_admin) — `{ username, password }` auto builds IDs
- `GET /teachers` (school_admin)
- `PATCH /teachers/:id/status` (school_admin) — `{ is_active }`
- `POST /teachers/complete-profile` (teacher) — profile fields
- `GET /teachers/me` (teacher)
- `GET /teachers/dashboard` (teacher) — timetable/homework/report-card metrics

## Parents
- `POST /parents/parents` (school_admin) — `{ student_id, relation_type }`
- `POST /parents/parents/link` (school_admin) — `{ parent_user_id, student_id, relation_type }`
- `PATCH /parents/parents/profile` (parent) — `{ name?, phone? }`
- `GET /parents/parents/profile` (parent)
- `GET /parents/parents/children` (parent) — query `{ limit?, offset? }`
- `GET /parents/parents/dashboard` (parent) — daily view (timetable/homework/attendance/report cards)

## Approvals
- `GET /teachers/approvals/pending` (teacher) — query filters
- `POST /teachers/approvals/:type/:id/:action` (teacher) — `{ rejection_reason? }`
- `GET /admin/approvals/pending` (school_admin)
- `POST /admin/approvals/:type/:id/:action` (school_admin)
- Teacher profile: `PATCH /teachers/profile/request` (teacher), `POST /admin/teachers/:teacher_id/approve` (school_admin)
- Student profile: `PATCH /students/profile/request` (student), `POST /teachers/students/:student_id/approve` (teacher)
- Parent approval: `POST /teachers/parents` (teacher), `POST /admin/parents/:parent_id/approve` (school_admin)
- Bulk approvals: `POST /admin/teachers/bulk-approve`, `POST /admin/parents/bulk-approve` (school_admin) — `{ ids, action }`

## Teacher Assignments (school_admin)
- `POST /teacher-assignments` — `{ teacher_id, class_id, section_id, subject_id, is_class_teacher? }`
- `GET /teacher-assignments` — pagination
- `GET /teacher-assignments/teacher/:teacherId` (teacher can omit param to get own)
- `GET /teacher-assignments/section/:sectionId`
- `PATCH /teacher-assignments/:id` — `{ is_active?, is_class_teacher? }`
- `DELETE /teacher-assignments/:id`

## Timetables
- `POST /timetables` (school_admin|teacher) — `{ class_id, section_id, day_of_week, entries:[{ start_time,end_time,is_break,title?,teacher_assignment_id? }] }`
- `GET /timetables/section` (student|parent|teacher|school_admin) — query `{ class_id, section_id }`
- `GET /timetables/teacher/me` (teacher)

## Attendance
- `POST /teachers/attendance` (teacher) — `{ teacher_class_session_id, records:[{ student_id, status }] }`
- `GET /teachers/attendance/summary` (teacher) — filters class/section/date
- `GET /parents/attendance/summary` (parent)
- `GET /students/attendance/summary` (student)
- `GET /teachers/attendance/analytics` (teacher) — class/section/student/date filters
- `GET /parents/attendance/analytics` (parent)

## Teacher Class Sessions
- `POST /teacher-class-sessions/start` (teacher) — `{ teacher_assignment_id, timetable_id? }`
- `POST /teacher-class-sessions/:id/end` (teacher)

## Homework
- `POST /homework` (school_admin|teacher) — `{ class_id, section_id, teacher_assignment_id, homework_date, description }`
- `GET /homework` (any auth) — filters class/section/date
- `POST /homework/:homework_id/submit` (student) — `{ is_completed, remark? }`
- `GET /homework/analytics/summary` — optional `{ class_id, section_id, date }`
- `GET /homework/analytics/:homework_id/students` — per-student status

## Notifications
- `POST /notifications` (school_admin|teacher) — `{ title, message, target_role: teacher|parent|student|all, class_id?, section_id? }`
- `GET /notifications` (all roles) — auto-scoped to school; students/parents filtered by class/section
- `POST /notifications/:id/acknowledge` (parent|teacher|student)
- `GET /notifications/:id/acknowledgements` (school_admin or sender)

## Group Chat
- `POST /group-chat` (teacher) — `{ subjectId, sectionId }` one per teacher+subject+section
- `GET /group-chat` (member) — list memberships
- `GET /group-chat/:chatId/messages` (member or school_admin)

## AI & RAG
- `POST /rag/ask` (student|teacher|parent) — `{ question, classLevel? }` query `voice=true` for audio
- `POST /teacher/ai` (teacher) — `{ aiType, payload }`
- `GET /analytics/ai/school` (school_admin|super_admin)
- `GET /analytics/ai/teacher` (teacher)
- `GET /analytics/ai/student` (student)

## Report Cards & Exams
- `POST /report-cards` (school_admin|teacher) — `{ student_id, exam_id }`
- `POST /report-cards/:id/marks` (school_admin|teacher) — `{ marks:[{ subject_id, marks_obtained, max_marks }] }`
- `POST /report-cards/:id/publish` (school_admin|teacher) — `{ remarks? }`
- `GET /report-cards/student/list` (student)
- `GET /report-cards/:id` (student/parent/teacher/school_admin) — school + relationship checked
- `POST /exams` (teacher|school_admin) — `{ class_id, name, start_date, end_date }`
- `POST /exams/:id/lock` (school_admin)
- `GET /exams` (any auth) — query `{ class_id, limit?, offset? }`

## Bulk Seeding (school_admin)
- `POST /bulk/bulk-create` or `/bulk/create` — `{ classes: ..., teacher_count?, students_per_section? }`

## Subscriptions (super_admin)
- `POST /subscriptions` — `{ schoolId, status, startDate?, endDate?, notes? }`

## Tokens (internal)
- AI token deductions happen via services; no public routes exposed here.

## Game (student|teacher)
- `POST /game/quiz/single/start` — `{ quizId, timeLimitMinutes }` → `{ sessionId, playerId }`
- `POST /game/quiz/single/submit` — `{ playerId, answers:[{ questionId, selectedIndex }] }` → `{ score, total }`
- `GET /game/quiz/:sessionId/leaderboard`
- `POST /game/quiz/multi/join` — `{ roomCode }` → `{ sessionId, playerId }`

## Dashboards
- Teacher: `GET /teachers/dashboard`
- Student: `GET /students/dashboard`
- Parent: `GET /parents/parents/dashboard`

## Socket Events
JWT passed via `socket.handshake.auth.token`.

### Notifications Socket
- Connect → server joins room `school:{school_id}` and emits `notification:connected` payload `{ school_id }`.

### Group Chat Socket
- `group:join` { chatId } → joins room if member.
- `group:message` { chatId, type, text?, imageUrl? } → broadcast `group:message:new`.
- `group:leave` { chatId }.

### Game Socket
- `quiz:join` { sessionId } → joins, returns `quiz:joined`.
- `quiz:start` { sessionId } (host only) → emits `quiz:started`.
- `quiz:answer` { sessionId, questionId, selectedIndex } → ack `quiz:answer_ack`.
- `quiz:finished` { sessionId } → may emit `quiz:all_finished` / `quiz:waiting` / `quiz:time_up`.
- Disconnect → marks player `DISCONNECTED`.

## Responses (convention)
- Success: `{ success: true, ... }` for most list/detail handlers; some legacy endpoints return bare resources (e.g., `/auth/login` → `{ token }`).
- Pagination: `{ total, items }` or `{ count, rows }` depending on Sequelize call; both include arrays of records.
- Errors: `{ message }` with HTTP status; 400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict.

### Common Payload Shapes
- **User (token claims)**: `{ id, role, school_id, teacher_id?, student_id?, class_id?, section_id?, first_login }`
- **Class**: `{ id, class_name, class_teacher_id?, is_active, sections?: [{ id, name, is_active }] }`
- **Section**: `{ id, class_id, name, class_teacher_id?, is_active }`
- **TeacherAssignment**: `{ id, teacher_id, class_id, section_id, subject_id, is_class_teacher, is_active }`
- **Timetable (section view)**: `{ [day_of_week]: [{ id, start_time, end_time, is_break, title?, subject? }] }`
- **Homework list**: `{ success, total, items:[{ id, class_id, section_id, subject_id, homework_date, description, created_by }] }`
- **Homework student status**: `{ success, data:[{ student_id, name, roll_no, is_completed, remark }] }`
- **Attendance summary item**: includes `TeacherClassSession` and `Student` with `User { id, name }`
- **Notification**: `{ id, title, message, target_role, class_id, section_id, created_at }`
- **ReportCard**: `{ id, student_id, class_id, exam_id, remarks?, published_at?, ReportCardMarks:[{ subject_id, marks_obtained, max_marks }] }`
- **Exam**: `{ id, class_id, name, start_date, end_date, is_locked }`
- **AI analytics**:
  - School: `{ total_chats, active_teachers, active_students, top_subjects:[{ subject, count }] }`
  - Teacher: `{ total_chats, avg_tokens, by_day:[{ date, count }] }`
  - Student: `{ total_chats, avg_tokens, by_day:[{ date, count }] }`
- **Dashboards**
  - Teacher: `{ classes:[{ id, class_name, sections:[...] }], timetable, homework_summary, pending_report_cards }`
  - Student: `{ student:{ id, name, admission_no, class_id, section_id }, metrics:{ attendance:{ present, total, percentage }, ai_tokens:{ total, used, remaining }, homework_pending, unread_notifications } }`
  - Parent daily: array of `{ student:{ id, name, roll_no, class_id, section_id }, timetable, homework:[{ homework_id, subject_id, description, is_completed }], attendance_last_7_days, report_cards }`

### Example Responses
- `GET /homework`
```json
{ "success": true, "total": 2, "items": [
  { "id": 12, "class_id": 3, "section_id": 5, "subject_id": 9, "homework_date": "2026-02-06", "description": "Read chapter 4" }
] }
```
- `GET /notifications`
```json
{ "success": true, "total": 3, "items": [
  { "id": 7, "title": "PTM", "message": "PTM on Friday", "target_role": "parent", "class_id": 3, "section_id": null, "created_at": "2026-02-05T10:00:00Z" }
] }
```
- `GET /timetables/section`
```json
{ "success": true, "data": {
  "monday": [
    { "id": 1, "start_time": "09:00", "end_time": "09:45", "is_break": false, "subject": { "id": 4, "name": "Math" } },
    { "id": 2, "start_time": "09:45", "end_time": "10:00", "is_break": true, "title": "Short Break" }
  ]
} }
```
