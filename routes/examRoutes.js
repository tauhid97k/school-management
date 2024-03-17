const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClassesAndSections,
  getExamForStudent,
  getExamDetailsForStudent,
  getAllExams,
  getExam,
  createExam,
  updateExam,
  updateExamStatus,
  deleteExam,
} = require('../controllers/examController')

// Protected Routes
router.get('/class-sections', authMiddleware(), getAllClassesAndSections)
router.get('/', authMiddleware(), getAllExams)
router.get('/:id', authMiddleware(), getExam)
router.get('/student/:id', authMiddleware(), getExamForStudent)
router.get(
  '/student/:id/details/:examId',
  authMiddleware(),
  getExamDetailsForStudent
)
router.post('/', authMiddleware(), createExam)
router.put('/:id', authMiddleware(), updateExam)
router.patch('/:id/status', authMiddleware(), updateExamStatus)
router.delete('/:id', authMiddleware(), deleteExam)

module.exports = router
