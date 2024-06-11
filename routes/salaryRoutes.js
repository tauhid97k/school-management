const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTeachersForSalary,
  getTeacherDetailsForSalary,
  generateTeacherSalaryInvoice,
  teachersSalaryInvoice,
  createTeacherSalaryInvoice,
  getStaffDetailsForSalary,
  getStaffsForSalary,
  generateStaffSalaryInvoice,
  staffsSalaryInvoice,
  createStaffSalaryInvoice,
} = require('../controllers/salaryController')

// Protected Routes
// Teacher Salary Routes
router.get('/teachers/:id', authMiddleware(), getTeacherDetailsForSalary)
router.get('/teachers', authMiddleware(), getTeachersForSalary)
router.get(
  '/generate-teachers-invoice',
  authMiddleware(),
  generateTeacherSalaryInvoice
)
router.get('/teachers-invoice', authMiddleware(), teachersSalaryInvoice)
router.post('/teachers-invoice', authMiddleware(), createTeacherSalaryInvoice)

// Staff Salary Routes
router.get('/staffs/:id', authMiddleware(), getStaffDetailsForSalary)
router.get('/staffs', authMiddleware(), getStaffsForSalary)
router.get(
  '/generate-staffs-invoice',
  authMiddleware(),
  generateStaffSalaryInvoice
)
router.get('/staffs-invoice', authMiddleware(), staffsSalaryInvoice)
router.post('/staffs-invoice', authMiddleware(), createStaffSalaryInvoice)

module.exports = router
