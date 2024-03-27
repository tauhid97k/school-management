const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getHeroSection,
  createHeroSection,
  updateHeroSection,
  deleteHeroSection,
} = require('../controllers/heroSectionController')

// Protected Routes
router.get('/', authMiddleware(), getHeroSection)
router.post('/', authMiddleware(), createHeroSection)
router.put('/:id', authMiddleware(), updateHeroSection)
router.delete('/:id', authMiddleware(), deleteHeroSection)

module.exports = router
