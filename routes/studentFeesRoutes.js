const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { createStudentFee } = require('../controllers/studentFeesController')

router.post('/', authMiddleware(), createStudentFee)

module.exports = router
