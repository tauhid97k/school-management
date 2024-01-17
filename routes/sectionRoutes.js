const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const sectionController = require('../controllers/sectionController')

// Protected Routes
router.get('/', authMiddleware(), sectionController.getAllSections)
router.post('/', authMiddleware(), sectionController.createSection)

module.exports = router
