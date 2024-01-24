const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const attendanceController = require('../controllers/attendanceController')

// Protected Routes
router.post(
  '/teacher',
  authMiddleware(),
  attendanceController.teacherAttendance
)

module.exports = router
