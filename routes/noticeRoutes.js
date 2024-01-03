const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const {
  getClassNotice,
  createClassNotice,
} = require('../controllers/noticeController')

// Protected Routes
router.use(verifyAuth)
router.get('/class/:id', getClassNotice)
router.post('/class/:id', createClassNotice)

module.exports = router
