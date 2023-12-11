const express = require('express')
const router = express.Router()
const verifyAuth = require('../middlewares/authMiddleware')
const { getTeachers } = require('../controllers/teacherController')

router.use(verifyAuth)
router.get('/', getTeachers)

module.exports = router
