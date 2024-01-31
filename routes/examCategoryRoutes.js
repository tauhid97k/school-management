const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllExamCategory,
  createExamCategory,
  updateExamCategory,
  deleteExamCategory,
} = require('../controllers/examCategoryController')

// Protected Routes
router.get('/', authMiddleware(), getAllExamCategory)
router.post('/', authMiddleware(), createExamCategory)
router.put('/:id', authMiddleware(), updateExamCategory)
router.delete('/:id', authMiddleware(), deleteExamCategory)

module.exports = router
