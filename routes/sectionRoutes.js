const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const sectionController = require('../controllers/sectionController')

// Protected Routes
router.get('/', authMiddleware(), sectionController.getAllSections)
router.get('/:id', authMiddleware(), sectionController.getSection)
router.post('/', authMiddleware(), sectionController.createSection)
router.put('/:id', authMiddleware(), sectionController.updateSection)
router.delete('/:id', authMiddleware(), sectionController.deleteSection)

module.exports = router
