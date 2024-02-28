const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getAllClassRoutines,
  getClassRoutine,
  createClassRoutine,
  updateClassRoutine,
  deleteClassRoutine,
} = require('../controllers/classRoutineController')

// Protected Routes
router.get('/', authMiddleware(), getAllClassRoutines)
router.get('/:id', authMiddleware(), getClassRoutine)
router.post('/', authMiddleware(), createClassRoutine)
router.put('/:id', authMiddleware(), updateClassRoutine)
router.delete('/:id', authMiddleware(), deleteClassRoutine)

module.exports = router
