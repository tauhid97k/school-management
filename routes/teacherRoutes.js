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

router.get('/', authMiddleware(), getTeachers)
router.get('/:id', authMiddleware(), getTeacher)
router.post('/', authMiddleware(), createTeacher)
router.put('/', authMiddleware(), updateTeacher)
router.delete('/:id', authMiddleware(), deleteTeacher)

module.exports = router
