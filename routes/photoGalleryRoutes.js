const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const photoGalleryController = require('../controllers/photoGalleryController')

// Protected Routes
router.get('/', authMiddleware(), photoGalleryController.getPhotoGallery)
router.post('/', authMiddleware(), photoGalleryController.addPhotoToGallery)
router.put(
  '/:id',
  authMiddleware(),
  photoGalleryController.updatePhotoFromGallery
)
router.delete('/:id', authMiddleware(), photoGalleryController.removePhoto)

module.exports = router
