const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  headerValidator,
  headerImageValidator,
} = require('../validators/headerValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /header
  @access   private
  @desc     Get header section
*/
const getHeaderSection = asyncHandler(async (req, res, next) => {
  const headerSection = await prisma.header.findFirst()

  headerSection.image = headerSection.image
    ? generateFileLink(`website/header/logo/${headerSection.image}`)
    : null

  res.json(headerSection)
})

/*
  @route    GET: /header
  @access   private
  @desc     Create header
*/
const createHeaderSection = asyncHandler(async (req, res, next) => {
  const data = await headerValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check if header section already exist
  await prisma.$transaction(async (tx) => {
    const checkHeaderSection = await tx.header.count()
    if (checkHeaderSection > 0)
      return res.status(400).json({
        message: 'Header section already exist',
      })

    if (req.files) {
      const { image } = await headerImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Logo Img
      const uniqueFolder = `logo_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/header/logo/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Logo',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.header.create({
      data,
    })

    res.json({
      message: 'Header section created successfully',
    })
  })
})

/*
  @route    PUT: /header/:id
  @access   private
  @desc     Update header section
*/
const updateHeaderSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await headerValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findHeaderSection = await tx.header.findUnique({
      where: {
        id,
      },
    })

    if (!findHeaderSection)
      return res.status(404).json({
        message: 'No header section found',
      })

    if (req.files) {
      const { image } = await headerImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Image (If Exist)
      if (findHeaderSection.image) {
        try {
          const photoDir = `uploads/website/header/logo/${
            findHeaderSection.image.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous logo',
          })
        }
      }

      // New Image
      const uniqueFolder = `logo_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/header/logo/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving logo',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.header.update({
      where: { id: findHeaderSection.id },
      data,
    })

    res.json({
      message: 'Header section updated',
    })
  })
})

/*
  @route    DELETE: /header/:id
  @access   private
  @desc     Delete header section
*/
const deleteHeaderSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findHeaderSection = await tx.header.findUnique({
      where: {
        id,
      },
    })

    if (!findHeaderSection)
      return res.status(404).json({
        message: 'No header section found',
      })

    // Delete Image (If Exist)
    if (findHeaderSection.image) {
      try {
        const photoDir = `uploads/website/header/logo/${
          findHeaderSection.image.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting logo',
        })
      }
    }

    await tx.header.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Header section deleted',
    })
  })
})

module.exports = {
  getHeaderSection,
  createHeaderSection,
  updateHeaderSection,
  deleteHeaderSection,
}
