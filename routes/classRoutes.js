const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController')

// Protected Routes
router.get('/', authMiddleware(), getAllClasses)
router.get('/:id', authMiddleware(), getClass)
router.post('/', authMiddleware(), createClass)
router.put('/:id', authMiddleware(), updateClass)
router.delete('/:id', authMiddleware(), deleteClass)

module.exports = router
