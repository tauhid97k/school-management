const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController')

// Protected Routes
router.get('/', authMiddleware(), getPaymentMethods)
router.post('/', authMiddleware(), createPaymentMethod)
router.put('/:id', authMiddleware(), updatePaymentMethod)
router.delete('/:id', authMiddleware(), deletePaymentMethod)

module.exports = router
