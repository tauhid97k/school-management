const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  socialValidator,
  socialImageValidator,
} = require('../validators/socialValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /social
  @access   private
  @desc     Get social links
*/
const getSocialLinks = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [social, total] = await prisma.$transaction([
    prisma.social.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.social.count(),
  ])

  social.image = social.image
    ? generateFileLink(`website/social/${social.image}`)
    : null

  const formatData = social.map(
    ({ id, name, link, image, visibility, created_at, updated_at }) => ({
      id,
      name,
      link,
      visibility,
      image: image ? generateFileLink(`website/social/${image}`) : null,
      created_at,
      updated_at,
    })
  )

  res.json({
    data: formatData,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /social
  @access   private
  @desc     Create social link
*/
const createSocialLink = asyncHandler(async (req, res, next) => {
  const data = await socialValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { image } = await socialImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Social Img
      const uniqueFolder = `social_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/social/${uniqueFolder}/${image.name}`
      const filePathToSave = `${uniqueFolder}/${image.name}`

      image.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving Image',
          })
      })

      // Update file path (For saving to database)
      data.image = filePathToSave
    }

    await tx.social.create({
      data,
    })

    res.json({
      message: 'Social link added',
    })
  })
})

/*
  @route    PUT: /social/:id
  @access   private
  @desc     Update a social link
*/
const updateSocialLink = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await socialValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const social = await tx.social.findUnique({
      where: {
        id,
      },
    })

    if (!social)
      return res.status(404).json({
        message: 'No social link found',
      })

    if (req.files) {
      const { image } = await socialImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Image (If Exist)
      if (social.image) {
        try {
          const photoDir = `uploads/website/social/${
            social.image.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `social_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/social/${uniqueFolder}/${image.name}`
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

    await tx.social.update({
      where: { id: social.id },
      data,
    })

    res.json({
      message: 'Social link updated',
    })
  })
})

/*
  @route    DELETE: /social
  @access   private
  @desc     Delete a social link
*/
const deleteSocialLink = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const social = await tx.social.findUnique({
      where: {
        id,
      },
    })

    if (!social)
      return res.status(404).json({
        message: 'No social link found',
      })

    // Delete Image (If Exist)
    if (social.image) {
      try {
        const photoDir = `uploads/website/social/${social.image.split('/')[0]}`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.social.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Social link deleted',
    })
  })
})

module.exports = {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
}
