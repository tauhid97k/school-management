const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getAbout,
  createOrUpdateAbout,
  deleteAbout,
} = require('../controllers/aboutController')

// Protected Routes
router.get('/', getAbout)
router.post('/', authMiddleware(), createOrUpdateAbout)
router.delete('/:id', authMiddleware(), deleteAbout)

module.exports = router
