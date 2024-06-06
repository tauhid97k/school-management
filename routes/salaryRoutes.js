const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const {
  getTeachersForSalary,
  getTeacherDetailsForSalary,
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
  createTeacherSalaryInvoice,
  generateSalaryInvoice,
} = require("../controllers/salaryController")

// Protected Routes
router.post("/generate", authMiddleware(), generateSalaryInvoice)
router.get("/teachers/:id", authMiddleware(), getTeacherDetailsForSalary)
router.get("/teachers", authMiddleware(), getTeachersForSalary)
router.get(
  "/generate-teachers-invoice",
  authMiddleware(),
  generateTeacherSalaryInvoice
)
router.get("/teachers-invoice", authMiddleware(), teachersSalaryInvoice)
router.post("/teachers-invoice", authMiddleware(), createTeacherSalaryInvoice)

module.exports = router
