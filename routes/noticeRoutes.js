const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllNotice,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticesForAll,
  getAllNoticeForTeachers,
  getAllNoticeForClasses,
} = require('../controllers/noticeController')

// Protected Routes
// For All
router.get('/all', getNoticesForAll)

// For Teachers
router.get('/teachers', authMiddleware(), getAllNoticeForTeachers)

// For Students
router.get('/classes', authMiddleware(), getAllNoticeForClasses)

// For Admins
router.get('/', authMiddleware(), getAllNotice)
router.get('/:id', authMiddleware(), getNotice)
router.post('/', authMiddleware(), createNotice)
router.put('/:id', authMiddleware(), updateNotice)
router.delete('/:id', authMiddleware(), deleteNotice)

module.exports = router
