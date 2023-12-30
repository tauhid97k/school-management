const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const {
  getTeachers,
  createTeacher,
} = require('../controllers/teacherController')

router.use(verifyAuth)
router.get('/', getTeachers)
router.post('/', createTeacher)

module.exports = router
