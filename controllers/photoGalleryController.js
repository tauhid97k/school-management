const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  photoGalleryValidator,
  photoGalleryPhotoValidator,
} = require('../validators/photoGalleryValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { v4: uuidV4 } = require('uuid')
const generateFileLink = require('../utils/generateFileLink')
const fs = require('node:fs/promises')

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

  const formatPhotos = photos.map((data) => ({
    ...data,
    photo: generateFileLink(`photo-gallery/${data.photo}`),
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
  const data = await photoGalleryValidator.validate(req.body, {
    abortEarly: false,
  })
  const { photo } = await photoGalleryPhotoValidator.validate(req.files, {
    abortEarly: false,
  })

  // Photo
  const uniqueFolder = `gallery_${uuidV4()}_${new Date() * 1000}`
  const uploadPath = `uploads/photo-gallery/${uniqueFolder}/${photo.name}`
  const filePathToSave = `${uniqueFolder}/${photo.name}`

  photo.mv(uploadPath, (error) => {
    if (error)
      return res.status(500).json({
        message: 'Error saving photo',
      })
  })

  // Save file path to database
  data.photo = filePathToSave

  // Save unique file path to database
  await prisma.photo_gallery.create({
    data: {
      photo: filePathToSave,
      description: data.description,
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

  const data = await photoGalleryValidator.validate(req.body, {
    abortEarly: false,
  })
  const { photo } = await photoGalleryPhotoValidator.validate(req.files, {
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
    try {
      const photoDir = `uploads/photo-gallery/${
        photoToUpdate.photo.split('/')[0]
      }`
      await fs.rm(photoDir, { recursive: true })
    } catch (error) {
      return res.json({
        message: 'Error deleting previous photo',
      })
    }

    // Add New Photo
    const uniqueFolder = `gallery_${uuidV4()}_${new Date() * 1000}`
    const uploadPath = `uploads/photo-gallery/${uniqueFolder}/${photo.name}`
    const filePathToSave = `${uniqueFolder}/${photo.name}`

    photo.mv(uploadPath, (error) => {
      if (error)
        return res.status(500).json({
          message: 'Error saving photo',
        })
    })

    // Update generated path
    data.photo = filePathToSave

    // Save to database
    await tx.photo_gallery.update({
      where: {
        id,
      },
      data,
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

    // Delete Photo
    try {
      const photoDir = `uploads/photo-gallery/${
        photoToDelete.photo.split('/')[0]
      }`
      await fs.rm(photoDir, { recursive: true })
    } catch (error) {
      return res.json({
        message: 'Error deleting photo',
      })
    }

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
