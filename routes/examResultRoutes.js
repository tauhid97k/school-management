const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
  createExamResult,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)
router.post('/', authMiddleware(), createExamResult)

module.exports = router
