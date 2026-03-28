import express from "express";
import db from "../../config/db.js";
import { protect } from "../../shared/middlewares/auth.js";

const router = express.Router();


// =====================================
// ✅ 1. GET ASSIGNED TESTS
// =====================================
router.get("/student/tests", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, subject, topic, total_marks, created_at
      FROM assigned_tests
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("❌ TESTS ERROR:", err.message);
    return res.status(500).json({ message: "Error fetching tests" });
  }
});


// =====================================
// ✅ 2. AI TESTS (FILTER BY CLASS/SECTION)
// =====================================
router.get("/student/ai-tests", protect, async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const studentRes = await db.query(
      "SELECT class_id, section_id FROM students WHERE id = $1",
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { class_id, section_id } = studentRes.rows[0];

    const result = await db.query(
      `SELECT * FROM assigned_tests
       WHERE class_id = $1 AND section_id = $2`,
      [class_id, section_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("❌ AI TEST ERROR:", err.message);
    return res.status(500).json({ message: "Error fetching AI tests" });
  }
});


// =====================================
// ✅ 3. LOCK STATUS
// =====================================
router.get("/student/ai-tests/lock-status", async (req, res) => {
  try {
    console.log("🔒 Lock Status API HIT");

    return res.json({
      success: true,
      locked: false,
    });

  } catch (err) {
    console.error("❌ LOCK ERROR:", err.message);
    return res.status(500).json({ message: "Lock status error" });
  }
});


// =====================================
// ✅ 4. GET SINGLE TEST
// =====================================
router.get("/student/tests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM assigned_tests WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Test not found" });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {
    console.error("❌ SINGLE TEST ERROR:", err.message);
    return res.status(500).json({ message: "Error fetching test" });
  }
});


// =====================================
// ✅ 5. SUBMIT TEST
// =====================================
router.post("/student/submit-test", protect, async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { testId, answers } = req.body;

    if (!studentId || !testId) {
      return res.status(400).json({ message: "Missing data" });
    }

    const safeAnswers = Array.isArray(answers) ? answers : [];
    const score = safeAnswers.length;

    await db.query(
      `INSERT INTO test_submissions (student_id, test_id, answers, score)
       VALUES ($1, $2, $3, $4)`,
      [studentId, testId, JSON.stringify(safeAnswers), score]
    );

    return res.json({
      success: true,
      message: "Test submitted successfully",
      score,
    });

  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err.message);
    return res.status(500).json({ message: "Submit failed" });
  }
});


// =====================================
// ✅ 6. GET RESULTS
// =====================================
router.get("/student/results/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await db.query(
      `SELECT * FROM test_submissions WHERE student_id = $1`,
      [studentId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("❌ RESULTS ERROR:", err.message);
    return res.status(500).json({ message: "Error fetching results" });
  }
});


// =====================================
// ✅ 7. LEADERBOARD
// =====================================
router.get("/student/leaderboard", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT student_id, SUM(score) as total_score
      FROM test_submissions
      GROUP BY student_id
      ORDER BY total_score DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("❌ LEADERBOARD ERROR:", err.message);
    return res.status(500).json({ message: "Leaderboard error" });
  }
});


export default router;

