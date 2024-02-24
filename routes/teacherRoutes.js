const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getClassesForTeacher,
  getSubjectsForTeacher,
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController')

router.get('/:id/classes', getClassesForTeacher)
router.get('/:id/subjects', getSubjectsForTeacher)
router.get('/', getTeachers)
router.get('/:id', authMiddleware(), getTeacher)
router.post('/', createTeacher)
router.put('/:id', authMiddleware(), updateTeacher)
router.delete('/:id', authMiddleware(), deleteTeacher)

module.exports = router
