const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
  getExamResults,
  getExamResultDetails,
  createExamResult,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)
router.get('/', authMiddleware(), getExamResults)
router.get('/:id', authMiddleware(), getExamResultDetails)
router.post('/', authMiddleware(), createExamResult)

module.exports = router
