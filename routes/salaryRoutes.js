const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const {
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
} = require("../controllers/salaryController")

// Protected Routes
router.get("/generate-teachers-invoice", generateTeacherSalaryInvoice)
router.get("/teachers-invoice", teachersSalaryInvoice)

module.exports = router
