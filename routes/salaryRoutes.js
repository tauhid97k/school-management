const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const expenseController = require('../controllers/expenseController')

// Protected Routes
router.get('/', authMiddleware(), expenseController.getAllExpenses)
router.get('/:id', authMiddleware(), expenseController.getExpense)
router.post('/', authMiddleware(), expenseController.createExpense)
router.put('/:id', authMiddleware(), expenseController.updateExpense)
router.delete('/:id', authMiddleware(), expenseController.deleteExpense)

module.exports = router
