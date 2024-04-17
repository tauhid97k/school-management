const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getHeaderSection,
  createHeaderSection,
  updateHeaderSection,
  deleteHeaderSection,
} = require('../controllers/headerController')

// Protected Routes
router.get('/', getHeaderSection)
router.post('/', authMiddleware(), createHeaderSection)
router.put('/:id', authMiddleware(), updateHeaderSection)
router.delete('/:id', authMiddleware(), deleteHeaderSection)

module.exports = router
