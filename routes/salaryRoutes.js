const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const {
  getUserTypeWithInfo,
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
  createTeacherSalaryInvoice,
} = require("../controllers/salaryController")

// Protected Routes
router.get("/user-info", authMiddleware(), getUserTypeWithInfo)
router.get("/generate-teachers-invoice", generateTeacherSalaryInvoice)
router.get("/teachers-invoice", teachersSalaryInvoice)
router.post("/teachers-invoice", createTeacherSalaryInvoice)

module.exports = router
