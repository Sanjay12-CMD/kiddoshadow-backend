import express from "express";
import db from './config/db.js';

const router = express.Router();

/**
 * ✅ GET: Assigned Tests
 * URL: /api/student/tests
 */
router.get("/student/tests", async (req, res) => {
  try {
    console.log("📘 Fetching Assigned Tests...");

    const result = await db.query("SELECT * FROM assigned_tests");

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (err) {
    console.error("❌ ERROR fetching tests:", err.message);

    return res.status(500).json({
      success: false,
      message: "Error fetching tests",
    });
  }
});


/**
 * ✅ GET: Lock Status
 * URL: /api/student/tests/lock-status
 */
router.get("/student/tests/lock-status", async (req, res) => {
  try {
    console.log("🔒 Lock Status API HIT");

    // Temporary static response (safe, no DB crash)
    return res.status(200).json({
      success: true,
      locked: false,
    });

  } catch (err) {
    console.error("❌ LOCK STATUS ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Error fetching lock status",
    });
  }
});

export default router;
