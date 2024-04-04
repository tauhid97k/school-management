const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAdmins,
  getUsersCount,
  getStudentAttendanceStats,
} = require('../controllers/adminController')

router.get('/', authMiddleware(), getAdmins)
router.get('/stats/users', authMiddleware(), getUsersCount)
router.get('/stats/attendance/students', getStudentAttendanceStats)

module.exports = router
