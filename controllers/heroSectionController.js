const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  heroSectionValidator,
  heroBannerValidator,
} = require('../validators/heroSectionValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /hero-section
  @access   private
  @desc     Get hero section
*/
const getHeroSection = asyncHandler(async (req, res, next) => {
  const heroSection = await prisma.hero_section.findFirst()

  heroSection.image = heroSection.image
    ? generateFileLink(`website/hero/${heroSection.image}`)
    : null

  res.json(heroSection)
})

/*
  @route    GET: /hero-section
  @access   private
  @desc     Create hero section
*/
const createHeroSection = asyncHandler(async (req, res, next) => {
  const data = await heroSectionValidator().validate(req.body, {
    abortEarly: false,
  })

  // Check if hero section already exist
  await prisma.$transaction(async (tx) => {
    const checkHeroSection = await tx.hero_section.count()
    if (checkHeroSection > 0)
      return res.status(400).json({
        message: 'Hero section already exist',
      })

    if (req.files) {
      const { image } = await heroBannerValidator().validate(req.files, {
        abortEarly: false,
      })

      // Profile Img
      const uniqueFolder = `banner_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/hero/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Banner',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.hero_section.create({
      data,
    })

    res.json({
      message: 'Hero section created successfully',
    })
  })
})

/*
  @route    PUT: /hero-section/:id
  @access   private
  @desc     Update hero section
*/
const updateHeroSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await heroSectionValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findHeroSection = await tx.hero_section.findUnique({
      where: {
        id,
      },
    })

    if (!findHeroSection)
      return res.status(404).json({
        message: 'No hero section found',
      })

    if (req.files) {
      const { image } = await heroBannerValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Image (If Exist)
      if (findHeroSection.image) {
        try {
          const photoDir = `uploads/website/hero/${
            findHeroSection.image.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `hero_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/hero/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving image',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.hero_section.update({
      where: { id },
      data,
    })

    res.json({
      message: 'Hero section updated',
    })
  })
})

/*
  @route    DELETE: /hero-section/:id
  @access   private
  @desc     Delete hero section
*/
const deleteHeroSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findHeroSection = await tx.hero_section.findUnique({
      where: {
        id,
      },
    })

    if (!findHeroSection)
      return res.status(404).json({
        message: 'No hero section found',
      })

    // Delete Image (If Exist)
    if (findHeroSection.image) {
      try {
        const photoDir = `uploads/website/hero/${
          findHeroSection.image.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.hero_section.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Hero section deleted',
    })
  })
})

module.exports = {
  getHeroSection,
  createHeroSection,
  updateHeroSection,
  deleteHeroSection,
}
