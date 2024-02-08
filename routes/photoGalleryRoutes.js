const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const websiteController = require('../controllers/websiteController')

// Protected Routes
router.get('/', websiteController.getPhotoGallery)
router.post('/', websiteController.addPhotoToGallery)
router.put('/:id', websiteController.updatePhotoFromGallery)
router.delete('/:id', websiteController.removePhoto)

module.exports = router
