const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')

const {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} = require('../controllers/socialController')

// Protected Routes
router.get('/', authMiddleware(), getSocialLinks)
router.post('/', authMiddleware(), createSocialLink)
router.put('/:id', authMiddleware(), updateSocialLink)
router.delete('/:id', authMiddleware(), deleteSocialLink)

module.exports = router
