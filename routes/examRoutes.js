const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClassesAndSections,
  getAllExams,
} = require('../controllers/examController')

// Protected Routes
router.get('/class-sections', authMiddleware(), getAllClassesAndSections)
router.get('/', authMiddleware(), getAllExams)

module.exports = router
