const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController')

router.get('/', authMiddleware(), getStudents)
router.get('/:id', authMiddleware(), getStudent)
router.post('/', authMiddleware(), createStudent)
router.put('/:id', authMiddleware(), updateStudent)
router.delete('/:id', authMiddleware(), deleteStudent)

module.exports = router
