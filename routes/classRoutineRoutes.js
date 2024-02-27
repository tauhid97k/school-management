const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { getAllClassRoutines } = require('../controllers/classRoutineController')

// Protected Routes
router.get('/', authMiddleware(), getAllClassRoutines)

module.exports = router
