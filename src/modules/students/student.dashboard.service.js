import Student from "./student.model.js";
import Attendance from "../attendance/attendance.model.js";
// import Homework from "../homework/homework.model.js"; // Verify if available
// import Notification from "../notifications/notification.model.js"; // Verify if available
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";

export const getStudentDashboardService = async ({ student_user_id }) => {
    const student = await Student.findOne({
        where: { user_id: student_user_id },
        include: [{ model: User, attributes: ["name"] }],
    });
    if (!student) {
        throw new AppError("Student profile not found", 404);
    }

    // 1. Attendance Percentage
    const totalDays = await Attendance.count({
        where: { student_id: student.id },
    });
    const presentDays = await Attendance.count({
        where: {
            student_id: student.id,
            status: 'present'
        },
    });
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // 2. AI Tokens (Mock for now, or fetch if available)
    const aiTokens = {
        total: 1000,
        used: 150,
        remaining: 850
    };

    return {
        student: {
            id: student.id,
            name: (student.user ?? student.User)?.name ?? null,
            admission_no: student.admission_no,
            class_id: student.class_id,
            section_id: student.section_id
        },
        metrics: {
            attendance: {
                present: presentDays,
                total: totalDays,
                percentage: attendancePercentage
            },
            ai_tokens: aiTokens,
            homework_pending: 0, // Placeholder until homework model integrated
            unread_notifications: 0 // Placeholder
        }
    };
};
