const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getStudentClassRoutine,
  getTeacherClassRoutine,
  getRoutineByClassOrSection,
  getAllRoutineClasses,
  getClassRoutineOrSections,
  getSectionRoutine,
  createClassRoutine,
  updateClassRoutine,
  deleteClassRoutineOnWeek,
  deleteClassRoutine,
} = require('../controllers/classRoutineController')

// Protected Routes
router.get('/student/:id', authMiddleware(), getStudentClassRoutine)
router.get('/teacher/:id', authMiddleware(), getTeacherClassRoutine)
router.get('/routine', authMiddleware(), getRoutineByClassOrSection)
router.get('/classes', authMiddleware(), getAllRoutineClasses)
router.get('/:id', authMiddleware(), getClassRoutineOrSections)
router.get('/section/:id', authMiddleware(), getSectionRoutine)
router.post('/', authMiddleware(), createClassRoutine)
router.put('/:id', authMiddleware(), updateClassRoutine)
router.delete('/:id', authMiddleware(), deleteClassRoutine)
router.delete('/:id/week', authMiddleware(), deleteClassRoutineOnWeek)

module.exports = router
