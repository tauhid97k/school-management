const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getFooterContact,
  createOrUpdateFooterContact,
  deleteFooterContact,
} = require('../controllers/footerContactController')

// Protected Routes
router.get('/', getFooterContact)
router.post('/', authMiddleware(), createOrUpdateFooterContact)
router.delete('/:id', authMiddleware(), deleteFooterContact)

module.exports = router
