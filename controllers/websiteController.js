const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const { photoGalleryValidator } = require('../validators/photoGalleryValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { v4: uuid } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')
const fs = require('fs/promises')

/*
  @route    GET: /photo-gallery
  @access   private
  @desc     Get photo gallery
*/
const getPhotoGallery = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [photos, total] = await prisma.$transaction([
    prisma.photo_gallery.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.photo_gallery.count(),
  ])

  const formatPhotos = photos.map(({ id, photo, created_at, updated_at }) => ({
    id,
    photo: generateFileLink(`photo-gallery/${photo}`),
    created_at,
    updated_at,
  }))

  res.json({
    data: formatPhotos,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /photo-gallery
  @access   private
  @desc     Add photo to gallery
*/
const addPhotoToGallery = asyncHandler(async (req, res, next) => {
  await photoGalleryValidator.validate(req.files, {
    abortEarly: false,
  })

  const { photo } = req.files
  const fileNameWithoutExt = photo.name.split('.').shift()
  const uniqueFolderName = `${uuid()}_${fileNameWithoutExt}`

  // The path where the file is uploaded
  const uploadPath = `uploads/photo-gallery/${uniqueFolderName}/${photo.name}`
  const filePathToSave = `${uniqueFolderName}/${photo.name}`

  // Move the uploaded file to the correct folder
  photo.mv(uploadPath, (error) => {
    if (error)
      return res.status(500).json({
        message: 'Error uploading photo',
      })
  })

  // Save unique file path to database
  await prisma.photo_gallery.create({
    data: {
      photo: filePathToSave,
    },
  })

  res.json({
    message: 'Photo added to gallery',
  })
})

/*
  @route    PUT: /photo-gallery/:id
  @access   private
  @desc     Update a photo
*/
const updatePhotoFromGallery = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await photoGalleryValidator.validate(req.files, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    // Find the photo
    const photoToUpdate = await tx.photo_gallery.findUnique({
      where: {
        id,
      },
    })

    if (!photoToUpdate) {
      return res.status(404).json({
        message: 'No photo found',
      })
    }

    // Delete Previous Photo
    const photoPath = `uploads/photo-gallery/${photoToUpdate.photo}`
    await fs.unlink(photoPath)

    await tx.photo_gallery.delete({
      where: {
        id,
      },
    })

    // Add New Photo
    const { photo } = req.files
    const fileNameWithoutExt = photo.name.split('.').shift()
    const uniqueFolderName = `${uuid()}_${fileNameWithoutExt}`

    // The path where the file is uploaded
    const uploadPath = `uploads/photo-gallery/${uniqueFolderName}/${photo.name}`
    const filePathToSave = `${uniqueFolderName}/${photo.name}`

    // Move the uploaded file to the correct folder
    photo.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error updating photo',
        })
    })

    // Save unique file path to database
    await tx.photo_gallery.update({
      where: {
        id,
      },
      data: {
        photo: filePathToSave,
      },
    })

    res.json({ message: 'Photo updated successfully' })
  })
})

/*
  @route    DELETE: /photo-gallery
  @access   private
  @desc     Remove photo from gallery
*/
const removePhoto = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    // Find the photo
    const photoToDelete = await tx.photo_gallery.findUnique({
      where: {
        id,
      },
    })

    if (!photoToDelete) {
      return res.status(404).json({
        message: 'No photo found',
      })
    }

    // Photo path
    const photoPath = `uploads/photo-gallery/${photoToDelete.photo}`
    await fs.unlink(photoPath)

    await tx.photo_gallery.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Photo deleted successfully',
    })
  })
})

module.exports = {
  getPhotoGallery,
  addPhotoToGallery,
  updatePhotoFromGallery,
  removePhoto,
}
