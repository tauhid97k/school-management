const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTeacherNoticeForStudent,
  getAllTeacherNotices,
  getTeacherNotice,
  createTeacherNotice,
  updateTeacherNotice,
  deleteTeacherNotice,
} = require('../controllers/teacherNoticeController')

// Protected Routes
router.get('/student/:id', getTeacherNoticeForStudent)
router.get('/teacher/:teacherId', getAllTeacherNotices)
router.get('/:id', getTeacherNotice)
router.post('/', authMiddleware(), createTeacherNotice)
router.put('/:id', authMiddleware(), updateTeacherNotice)
router.delete('/:id', authMiddleware(), deleteTeacherNotice)

module.exports = router
