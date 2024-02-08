const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const designationController = require('../controllers/expenseCategoryController')

// Protected Routes
router.get('/', authMiddleware(), designationController.getAllExpenseCategory)
router.post('/', authMiddleware(), designationController.createExpenseCategory)
router.put(
  '/:id',
  authMiddleware(),
  designationController.updateExpenseCategory
)
router.delete(
  '/:id',
  authMiddleware(),
  designationController.deleteExpenseCategory
)

module.exports = router
