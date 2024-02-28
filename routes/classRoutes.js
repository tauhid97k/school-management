const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClasses,
  getClassSections,
  getClassSubjects,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController')

// Protected Routes
router.get('/', authMiddleware(), getAllClasses)
router.get('/:id/sections', authMiddleware(), getClassSections)
router.get('/:id/subjects', authMiddleware(), getClassSubjects)
router.get('/:id', authMiddleware(), getClass)
router.post('/', authMiddleware(), createClass)
router.put('/:id', authMiddleware(), updateClass)
router.delete('/:id', authMiddleware(), deleteClass)

module.exports = router
