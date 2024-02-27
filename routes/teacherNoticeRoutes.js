const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllTeacherNotices,
  getTeacherNotice,
  createTeacherNotice,
  updateTeacherNotice,
  deleteTeacherNotice,
} = require('../controllers/teacherNoticeController')

// Protected Routes
router.get('/:teacherId', getAllTeacherNotices)
router.get('/:noticeId', getTeacherNotice)
router.post('/', authMiddleware(), createTeacherNotice)
router.put('/:teacherId/:noticeId', authMiddleware(), updateTeacherNotice)
router.delete('/:teacherId/:noticeId', authMiddleware(), deleteTeacherNotice)

module.exports = router
