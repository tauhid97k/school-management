const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactController')

// Protected Routes
router.get('/', getContact)
router.post('/', authMiddleware(), createContact)
router.put('/:id', authMiddleware(), updateContact)
router.delete('/:id', authMiddleware(), deleteContact)

module.exports = router
