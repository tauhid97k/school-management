const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const websiteController = require('../controllers/websiteController')

// Protected Routes
router.get('/', authMiddleware(), websiteController.getPhotoGallery)
router.post('/', authMiddleware(), websiteController.addPhotosToGallery)
router.delete('/:id', authMiddleware(), websiteController.removePhoto)

module.exports = router
