const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const expenseCategoryController = require('../controllers/expenseCategoryController')

// Protected Routes
router.get(
  '/',
  authMiddleware(),
  expenseCategoryController.getAllExpenseCategory
)
router.post(
  '/',
  authMiddleware(),
  expenseCategoryController.createExpenseCategory
)
router.put(
  '/:id',
  authMiddleware(),
  expenseCategoryController.updateExpenseCategory
)
router.delete(
  '/:id',
  authMiddleware(),
  expenseCategoryController.deleteExpenseCategory
)

module.exports = router
