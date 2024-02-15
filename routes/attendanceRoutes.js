const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const attendanceController = require('../controllers/attendanceController')

// Protected Routes
router.get(
  '/teachers',
  authMiddleware(),
  attendanceController.getTeachersForAttendance
)
router.get(
  '/teachers/:id',
  authMiddleware(),
  attendanceController.getTeacherAttendanceDetails
)
router.post(
  '/teachers',
  authMiddleware(),
  attendanceController.createTeacherAttendance
)

module.exports = router
