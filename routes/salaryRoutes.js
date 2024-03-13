const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const salaryController = require('../controllers/salaryController')

// Protected Routes
router.get('/user-info', authMiddleware(), salaryController.getUserTypeWithInfo)
router.get('/', authMiddleware(), salaryController.getSalaries)
router.get('/:id', authMiddleware(), salaryController.getSalaryDetails)
router.post('/', authMiddleware(), salaryController.createSalary)
router.put('/:id', authMiddleware(), salaryController.updateSalary)

module.exports = router
