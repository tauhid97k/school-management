const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} = require('../controllers/productCategoryController')

// Protected Routes
router.get('/', authMiddleware(), getProductCategories)
router.post('/', authMiddleware(), createProductCategory)
router.put('/:id', authMiddleware(), updateProductCategory)
router.delete('/:id', authMiddleware(), deleteProductCategory)

module.exports = router
