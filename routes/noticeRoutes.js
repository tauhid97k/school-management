const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllNotice,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController')

// Protected Routes
router.get('/', getAllNotice)
router.get('/:id', getNotice)
router.post('/', authMiddleware(), createNotice)
router.put('/:id', authMiddleware(), updateNotice)
router.delete('/:id', authMiddleware(), deleteNotice)

module.exports = router
