const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const salaryController = require('../controllers/salaryController')

// Protected Routes
router.get('/user-info', authMiddleware(), salaryController.getUserTypeWithInfo)

module.exports = router
