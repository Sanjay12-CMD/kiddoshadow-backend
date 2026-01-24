// src/models/initModels.js
import db from "../config/db.js";

/* ===================== CORE ===================== */
import School from "../modules/schools/school.model.js";
import User from "../modules/users/user.model.js";

/* ===================== PEOPLE ===================== */
import Teacher from "../modules/teachers/teacher.model.js";
import Parent from "../modules/parents/parent.model.js";
import Student from "../modules/students/student.model.js";


/* ===================== ACADEMICS ===================== */
import Class from "../modules/classes/classes.model.js";
import Subject from "../modules/subjects/subject.model.js";
import Timetable from "../modules/timetables/timetable.model.js";
import Chapter from "../modules/chapters/chapter.model.js";
import Topic from "../modules/topics/topic.model.js";
import Section from "../modules/sections/section.model.js";

//homework
import Homework from "../modules/homework/homework.model.js";
import HomeworkSubmission from "../modules/homework/homework-submission.model.js";


/* ===================== ACTIVITY ===================== */
import Attendance from "../modules/attendance/attendance.model.js";
import TopicProgress from "../modules/topic-progress/topic-progress.model.js";

/* ===================== CONTENT ===================== */
import StudentContent from "../modules/student-content/student-content.model.js";
import TeacherContent from "../modules/teacher-content/teacher-content.model.js";

/* ===================== QUIZ / GAME ===================== */
import Quiz from "../modules/quiz/quiz.model.js";
import QuizQuestion from "../modules/quiz/quiz-question.model.js";
import GameSession from "../modules/game/game-session.model.js";
import GameSessionPlayer from "../modules/game/game-session-player.model.js";
import PlayerAnswer from "../modules/game/player-answer.model.js";

/* ===================== AI / LOGS ===================== */
import AiChatLog from "../modules/ai-chat-logs/ai-chat-log.model.js";
import AiOutput from "../modules/ai-outputs/ai-outputs.model.js";
import VoiceLog from "../modules/voice-logs/voice-log.model.js";

/* ===================== TOKENS / BILLING ===================== */
import Subscription from "../modules/subscriptions/subscription.model.js";
import TokenAccount from "../modules/tokens/token-account.model.js";
import TokenTransaction from "../modules/tokens/token-transaction.model.js";

/* ===================== REPORT CARDS ===================== */
import Exam from "../modules/report-cards/exam.model.js";
import ReportCard from "../modules/report-cards/report-card.model.js";
import ReportCardMark from "../modules/report-cards/report-card-mark.model.js";

/* ===================== MISC ===================== */
import Notification from "../modules/notifications/notifications.model.js";
import NotificationAck from "../modules/notifications/notification-ack.model.js";


const initAssociations = () => {
  /* ==================== SCHOOL ==================== */
  School.hasMany(User, { foreignKey: "school_id" });
  School.hasMany(Class, { foreignKey: "school_id" });
  School.hasMany(Teacher, { foreignKey: "school_id" });
  School.hasMany(Student, { foreignKey: "school_id" });
  School.hasMany(Section, { foreignKey: "school_id" });

  User.belongsTo(School, { foreignKey: "school_id" });
  Section.belongsTo(School, { foreignKey: "school_id" });

  /* ==================== USER PROFILES ==================== */
  User.hasOne(Student, { foreignKey: "user_id" });
  Student.belongsTo(User, { foreignKey: "user_id" });

  User.hasOne(Teacher, { foreignKey: "user_id" });
  Teacher.belongsTo(User, { foreignKey: "user_id" });

  User.hasOne(Parent, { foreignKey: "user_id" });
  Parent.belongsTo(User, { foreignKey: "user_id" });

  /* ==================== STUDENT (LEGACY – KEEP) ==================== */
  Student.belongsTo(School, { foreignKey: "school_id" });
  Student.belongsTo(Class, {
  foreignKey: "class_id",
  onDelete: "SET NULL",
});
  Student.belongsTo(Section, { foreignKey: "section_id" });

  Class.hasMany(Student, { foreignKey: "class_id" });
  Section.hasMany(Student, { foreignKey: "section_id" });

  Student.hasMany(Attendance, { foreignKey: "student_id" });
  Student.hasMany(StudentContent, { foreignKey: "student_id" });
  Student.hasMany(TopicProgress, { foreignKey: "student_id" });

    /* ==================== REPORT CARDS ==================== */

  Exam.belongsTo(School, { foreignKey: "school_id" });
  Exam.belongsTo(Class, { foreignKey: "class_id" });

  ReportCard.belongsTo(Student, { foreignKey: "student_id" });
  ReportCard.belongsTo(Class, { foreignKey: "class_id" });
  ReportCard.belongsTo(Exam, { foreignKey: "exam_id" });

  ReportCard.hasMany(ReportCardMark, {
    foreignKey: "report_card_id",
    onDelete: "CASCADE",
  });

  ReportCardMark.belongsTo(ReportCard, {
    foreignKey: "report_card_id",
  });

  ReportCardMark.belongsTo(Subject, {
    foreignKey: "subject_id",
  });


  /* ==================== STUDENT ↔ PARENT ==================== */
  Student.belongsToMany(Parent, {
    through: "student_parents",
    foreignKey: "student_id",
    otherKey: "parent_id",
  });

  Parent.belongsToMany(Student, {
    through: "student_parents",
    foreignKey: "parent_id",
    otherKey: "student_id",
  });

  /* ==================== TEACHER ==================== */
  Teacher.belongsTo(School, { foreignKey: "school_id" });
  Teacher.hasMany(Class, { foreignKey: "class_teacher_id" });

  /* ==================== CLASS ==================== */
  Class.belongsTo(School, { foreignKey: "school_id" });
  Class.belongsTo(Teacher, { foreignKey: "class_teacher_id" });
  Class.hasMany(Attendance, { foreignKey: "class_id" });
  Class.hasMany(Section, { foreignKey: "class_id" });

  /* ==================== SUBJECT ==================== */
  Subject.belongsTo(School, { foreignKey: "school_id" });

  /* ==================== TIMETABLE ==================== */
  Timetable.belongsTo(Class, { foreignKey: "class_id" });
  Timetable.belongsTo(Teacher, { foreignKey: "teacher_id" });
  Timetable.belongsTo(Subject, { foreignKey: "subject_id" });

  /* ==================== CHAPTER / TOPIC ==================== */
  Chapter.belongsTo(Subject, { foreignKey: "subject_id" });
  Chapter.hasMany(Topic, { foreignKey: "chapter_id" });

  Topic.belongsTo(Chapter, { foreignKey: "chapter_id" });
  Topic.hasMany(Quiz, { foreignKey: "topic_id" });

  /* ==================== QUIZ / GAME ==================== */
  Quiz.belongsTo(User, { foreignKey: "owner_user_id" });
  Quiz.hasMany(QuizQuestion, { foreignKey: "quiz_id" });

  QuizQuestion.belongsTo(Quiz, { foreignKey: "quiz_id" });

  GameSession.belongsTo(Quiz, { foreignKey: "quiz_id" });
  GameSession.belongsTo(User, { foreignKey: "host_user_id" });
  GameSession.hasMany(GameSessionPlayer, { foreignKey: "session_id" });

  GameSessionPlayer.belongsTo(GameSession, { foreignKey: "session_id" });
  GameSessionPlayer.belongsTo(User, { foreignKey: "user_id" });
  GameSessionPlayer.hasMany(PlayerAnswer, {
    foreignKey: "session_player_id",
  });

  PlayerAnswer.belongsTo(GameSessionPlayer, {
    foreignKey: "session_player_id",
  });
  PlayerAnswer.belongsTo(QuizQuestion, { foreignKey: "question_id" });

  /* ==================== AI / LOGS ==================== */
  AiChatLog.belongsTo(User, { foreignKey: "user_id" });
  VoiceLog.belongsTo(User, { foreignKey: "user_id" });
  AiOutput.belongsTo(User, { foreignKey: "user_id" });
 
  //homeworks
  Homework.belongsTo(Class, { foreignKey: "class_id" });
 Homework.belongsTo(Section, { foreignKey: "section_id" });
 Homework.belongsTo(Subject, { foreignKey: "subject_id" });
HomeworkSubmission.belongsTo(Homework, { foreignKey: "homework_id" });
HomeworkSubmission.belongsTo(Student, { foreignKey: "student_id" });

Homework.hasMany(HomeworkSubmission, {
  foreignKey: "homework_id",
  onDelete: "CASCADE",
});


  /* ==================== TOKENS ==================== */
  Subscription.belongsTo(User, { foreignKey: "user_id" });
  TokenAccount.belongsTo(User, { foreignKey: "user_id" });
  TokenTransaction.belongsTo(User, { foreignKey: "user_id" });

  /* ==================== NOTIFICATIONS ==================== */
  Notification.belongsTo(User, { foreignKey: "user_id" });
  Notification.belongsTo(School, { foreignKey: "school_id" });
  Notification.belongsTo(Class, { foreignKey: "class_id" });
  NotificationAck.belongsTo(Notification, {
  foreignKey: "notification_id",
  onDelete: "CASCADE",
});

Notification.hasMany(NotificationAck, {
  foreignKey: "notification_id",
});
};

initAssociations();

export default db;
