const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
  getExamResults,
  createExamResult,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)
router.get('/', authMiddleware(), getExamResults)
router.post('/', authMiddleware(), createExamResult)

module.exports = router
