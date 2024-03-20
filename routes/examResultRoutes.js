const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getExamSubjectsForResults,
  getExamResultsForStudent,
  getExamResultDetailsForStudent,
  getExamsForResultForTeacher,
  getExamResultsForTeacher,
  getExamResults,
  getExamResultDetails,
  createExamResult,
  updateExamResult,
  getExamResultPublishing,
  publishExamResult,
} = require('../controllers/examResultController')

// Protected Routes
router.get('/publishing', authMiddleware(), getExamResultPublishing)
router.put('/publishing/:id', authMiddleware(), publishExamResult)
router.get('/student/:id', authMiddleware(), getExamResultsForStudent)
router.get(
  '/student/:id/result/:resultId',
  authMiddleware(),
  getExamResultDetailsForStudent
)
router.get('/teacher/:id/exams', authMiddleware(), getExamsForResultForTeacher)
router.get(
  '/teacher/:id/exams/:examId',
  authMiddleware(),
  getExamResultsForTeacher
)
router.get('/subjects', authMiddleware(), getExamSubjectsForResults)
router.get('/', authMiddleware(), getExamResults)
router.get('/:id', authMiddleware(), getExamResultDetails)
router.post('/', authMiddleware(), createExamResult)
router.put('/:id', authMiddleware(), updateExamResult)

module.exports = router
