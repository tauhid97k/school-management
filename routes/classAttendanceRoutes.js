const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const classAttendanceController = require('../controllers/classAttendanceController')

// Protected Routes
router.get(
  '/classes/:id/students',
  authMiddleware(),
  classAttendanceController.getStudentsForAttendance
)
router.get(
  '/students/:id',
  authMiddleware(),
  classAttendanceController.getStudentAttendanceDetails
)
router.post(
  '/students',
  authMiddleware(),
  classAttendanceController.createStudentAttendance
)

module.exports = router
