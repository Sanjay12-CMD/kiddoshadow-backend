import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();
import db from "./src/config/db.js";
import errorHandler from "./src/shared/errorHandler.js";
import "./src/models/initModels.js";




const app = express();

const PORT = process.env.PORT || 5000;

//common middlewares
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // true only if cookies are used
}));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));


//health check 
app.get("/", (req, res) => {res.json({ message: `server is running ;)` })});


// auth
import authRoutes from "./src/modules/auth/auth.routes.js";

// core entities
import schoolRoutes from "./src/modules/schools/school.routes.js";
import studentRoutes from "./src/modules/students/student.routes.js";
import teacherRoutes from "./src/modules/teachers/teacher.routes.js";
import parentRoutes from "./src/modules/parents/parent.routes.js";
import sectionRoutes from "./src/modules/sections/section.routes.js";

// approvals & dashboards
import approvalRoutes from "./src/modules/approvals/approval.routes.js";
import teacherApprovalRoutes from "./src/modules/teachers/teacher.approval.routes.js";
import studentApprovalRoutes from "./src/modules/students/student.approval.routes.js";
import parentApprovalRoutes from "./src/modules/parents/parent.approval.routes.js";
import parentDashboardRoutes from "./src/modules/parents/parent.dashboard.routes.js";
import auditRoutes from "./src/modules/audit/audit.routes.js";

// bulk approvals
import parentBulkRoutes from "./src/modules/parents/parent.bulk.routes.js";
import teacherBulkRoutes from "./src/modules/teachers/teacher.bulk.routes.js";

// attendance
import attendanceSummaryRoutes from "./src/modules/attendance/attendance.summary.routes.js";
import attendanceAnalyticsRoutes from "./src/modules/attendance/attendance.analytics.routes.js";

//rag
import ragRoutes from "./modules/rag/rag.routes.js";

app.use("/api/auth", authRoutes);

app.use("/api/schools", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/sections", sectionRoutes);

app.use("/api", approvalRoutes);
app.use("/api", teacherApprovalRoutes);
app.use("/api", studentApprovalRoutes);
app.use("/api", parentApprovalRoutes);
app.use("/api", parentDashboardRoutes);
app.use("/api", auditRoutes);

app.use("/api", parentBulkRoutes);
app.use("/api", teacherBulkRoutes);

app.use("/api", attendanceSummaryRoutes);
app.use("/api", attendanceAnalyticsRoutes);

//rag
app.use("/api/rag", ragRoutes);

//404 route path
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


//error handling middleware
app.use(errorHandler);

//server start
try {
  await db.authenticate();
  console.log("DB connected");

  await db.sync({ force: true }); // sync

  app.listen(PORT, "0.0.0.0", () =>
    console.log(`http://localhost:${PORT}`)
  );
} catch (err) {
  console.error("DB connection failed", err);
  process.exit(1);
}


