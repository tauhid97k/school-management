const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  createNotice,
  getClassNotice,
  createClassNotice,
} = require('../controllers/noticeController')

// Protected Routes
router.post('/', authMiddleware(), createNotice)
router.get('/class/:id', authMiddleware(), getClassNotice)
router.post('/class/:id', authMiddleware(), createClassNotice)

module.exports = router
