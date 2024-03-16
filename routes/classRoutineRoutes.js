const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getRoutineByClassOrSection,
  getAllRoutineClasses,
  getClassRoutineOrSections,
  getSectionRoutine,
  createClassRoutine,
  updateClassRoutine,
  deleteClassRoutine,
} = require('../controllers/classRoutineController')

// Protected Routes
router.get('/routine', authMiddleware(), getRoutineByClassOrSection)
router.get('/classes', authMiddleware(), getAllRoutineClasses)
router.get('/:id', authMiddleware(), getClassRoutineOrSections)
router.get('/section/:id', authMiddleware(), getSectionRoutine)
router.post('/', authMiddleware(), createClassRoutine)
router.put('/:id', authMiddleware(), updateClassRoutine)
router.delete('/:id', authMiddleware(), deleteClassRoutine)

module.exports = router
