const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const gradingController = require('../controllers/gradingController')

// Protected Routes
router.get('/', authMiddleware(), gradingController.getAllGrades)
router.get('/:id', authMiddleware(), gradingController.getGrade)
router.post('/', authMiddleware(), gradingController.createGrade)
router.put('/:id', authMiddleware(), gradingController.updateGrade)
router.delete('/:id', authMiddleware(), gradingController.deleteGrade)

module.exports = router
