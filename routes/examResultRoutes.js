const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
  getExamResults,
  getExamResultDetails,
  createExamResult,
  updateExamResult,
  getExamResultPublishing,
  publishExamResult,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)
router.get('/', authMiddleware(), getExamResults)
router.get('/:id', authMiddleware(), getExamResultDetails)
router.post('/', authMiddleware(), createExamResult)
router.put('/:id', authMiddleware(), updateExamResult)
router.get('/publishing', authMiddleware(), getExamResultPublishing)
router.put('/publishing/:id', authMiddleware(), publishExamResult)

module.exports = router
