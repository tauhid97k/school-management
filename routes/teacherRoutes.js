const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController')

router.get('/', getTeachers)
router.get('/:id', authMiddleware(), getTeacher)
router.post('/', createTeacher)
router.put('/:id', authMiddleware(), updateTeacher)
router.delete('/:id', authMiddleware(), deleteTeacher)

module.exports = router
