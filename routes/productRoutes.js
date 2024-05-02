const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController')

// Protected Routes
router.get('/', authMiddleware(), getProducts)
router.post('/', authMiddleware(), createProduct)
router.put('/:id', authMiddleware(), updateProduct)
router.delete('/:id', authMiddleware(), deleteProduct)

module.exports = router
