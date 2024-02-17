const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)

module.exports = router
