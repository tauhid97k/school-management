const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getContact,
  createOrUpdateContact,
  deleteContact,
} = require('../controllers/contactController')

// Protected Routes
router.get('/', getContact)
router.post('/', authMiddleware(), createOrUpdateContact)
router.delete('/:id', authMiddleware(), deleteContact)

module.exports = router
