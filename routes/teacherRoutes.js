const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getTeachers,
  createTeacher,
} = require('../controllers/teacherController')

router.get('/', authMiddleware(), getTeachers)
router.post('/', authMiddleware(), createTeacher)

module.exports = router
