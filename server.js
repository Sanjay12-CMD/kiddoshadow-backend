import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import db from "./src/config/db.js";
import errorHandler from "./src/shared/errorHandler.js";
import "./src/models/initModels.js";

// socket
import { createServer } from "http";
import { Server } from "socket.io";
import { initGameSocket } from "./src/socket/game.socket.js";
import { initGroupChatSocket } from "./src/socket/group-chat.socket.js";
import { initNotificationSocket } from "./src/socket/notification.socket.js";


const app = express();
const PORT = process.env.PORT || 5000;


//env validation
const requiredEnv = ['TTS_SERVICE_URL'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}


// HTTP + SOCKET SERVER

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST"],
  },
});

initGameSocket(io);
initGroupChatSocket(io);
initNotificationSocket(io);

// MIDDLEWARES
app.use(cors({
  origin: [   
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));


// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ message: "server is running ;)" });
});


// ROUTES
import authRoutes from "./src/modules/auth/auth.routes.js";
import schoolRoutes from "./src/modules/schools/school.routes.js";
import studentRoutes from "./src/modules/students/student.routes.js";
import teacherRoutes from "./src/modules/teachers/teacher.routes.js";
import parentRoutes from "./src/modules/parents/parent.routes.js";
import sectionRoutes from "./src/modules/sections/section.routes.js";

import approvalRoutes from "./src/modules/approvals/approval.routes.js";
import teacherApprovalRoutes from "./src/modules/teachers/teacher.approval.routes.js";
import studentApprovalRoutes from "./src/modules/students/student.approval.routes.js";
import parentApprovalRoutes from "./src/modules/parents/parent.approval.routes.js";
import parentDashboardRoutes from "./src/modules/parents/parent.dashboard.routes.js";
import auditRoutes from "./src/modules/audit/audit.routes.js";

import parentBulkRoutes from "./src/modules/parents/parent.bulk.routes.js";
import teacherBulkRoutes from "./src/modules/teachers/teacher.bulk.routes.js";

import attendanceSummaryRoutes from "./src/modules/attendance/attendance.summary.routes.js";
import attendanceAnalyticsRoutes from "./src/modules/attendance/attendance.analytics.routes.js";

import ragRoutes from "./src/modules/rag/rag.routes.js";
import teacherAiRoutes from "./src/modules/teacher-ai/teacher-ai.routes.js";
import aiAnalyticsRoutes from "./src/modules/ai-analytics/ai-analytics.routes.js";
import subscriptionRoutes from "./src/modules/subscriptions/subscription.routes.js";

// teacher planning & tracking
import teacherAssignmentRoutes from "./src/modules/teacher-assignments/teacher-assignment.routes.js";
import teacherTimetableRoutes from "./src/modules/teacher-timetables/teacher-timetable.routes.js";
import teacherClassSessionRoutes from "./src/modules/teacher-class-sessions/teacher-class-session.routes.js";


// auth
app.use("/api/auth", authRoutes);

// core
app.use("/api/schools", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/sections", sectionRoutes);

// approvals
app.use("/api", approvalRoutes);
app.use("/api", teacherApprovalRoutes);
app.use("/api", studentApprovalRoutes);
app.use("/api", parentApprovalRoutes);
app.use("/api", parentDashboardRoutes);
app.use("/api", auditRoutes);

// bulk
app.use("/api", parentBulkRoutes);
app.use("/api", teacherBulkRoutes);

// attendance
app.use("/api", attendanceSummaryRoutes);
app.use("/api", attendanceAnalyticsRoutes);

// subscriptions
app.use("/api", subscriptionRoutes);

// AI
app.use("/api/rag", ragRoutes);
app.use("/api", teacherAiRoutes);
app.use("/api", aiAnalyticsRoutes);

// teacher planning & tracking
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/teacher-timetables", teacherTimetableRoutes);
app.use("/api/teacher-class-sessions", teacherClassSessionRoutes);


// 404 + ERROR HANDLER
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);


// START SERVER
try {
  await db.authenticate();
  console.log("DB connected");

  await db.sync({ force: true }); // ⚠️ dev only

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server + Socket running on port ${PORT}`);
  });
} catch (err) {
  console.error("DB connection failed", err);
  process.exit(1);
}
