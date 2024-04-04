const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAdmins,
  getUsersCount,
  getStudentAttendanceStats,
  getStudentAdmissionGenderStats,
} = require('../controllers/adminController')

router.get('/', authMiddleware(), getAdmins)
router.get('/stats/users', authMiddleware(), getUsersCount)
router.get('/stats/attendance/students', getStudentAttendanceStats)
router.get('/stats/admissions/gender', getStudentAdmissionGenderStats)

module.exports = router
