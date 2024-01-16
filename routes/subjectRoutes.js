const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController')

// Protected Routes
router.get('/', authMiddleware(), getAllSubjects)
router.get('/:id', authMiddleware(), getSubject)
router.post('/', authMiddleware(), createSubject)
router.put('/:id', authMiddleware(), updateSubject)
router.delete('/:id', authMiddleware(), deleteSubject)

module.exports = router
