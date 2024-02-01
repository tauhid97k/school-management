const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClassesAndSections,
  getAllExams,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController')

// Protected Routes
router.get('/class-sections', authMiddleware(), getAllClassesAndSections)
router.get('/', authMiddleware(), getAllExams)
router.post('/', authMiddleware(), createExam)
router.put('/:id', authMiddleware(), updateExam)
router.delete('/:id', authMiddleware(), deleteExam)

module.exports = router
