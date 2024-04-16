const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { informationValidator } = require('../validators/informationValidator')
const { attachmentValidator } = require('../validators/attachmentValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /information
  @access   private
  @desc     Get information
*/
const getInformation = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [information, total] = await prisma.$transaction([
    prisma.information.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.information.count(),
  ])

  const formatData = information.map(
    ({ id, title, description, attachment, created_at, updated_at }) => ({
      id,
      title,
      description,
      attachment: attachment
        ? generateFileLink(`website/information/${attachment}`)
        : null,
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
  @route    POST: /information
  @access   private
  @desc     Create an information
*/
const createInformation = asyncHandler(async (req, res, next) => {
  const data = await informationValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Information Attachment
      const uniqueFolder = `information_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/information/${uniqueFolder}/${attachment.name}`
      const filePathToSave = `${uniqueFolder}/${attachment.name}`

      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving attachment',
          })
      })

      // Update file path (For saving to database)
      data.attachment = filePathToSave
    }

    await tx.information.create({
      data,
    })

    res.json({
      message: 'Information added',
    })
  })
})

/*
  @route    PUT: /information/:id
  @access   private
  @desc     Update an information
*/
const updateInformation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await informationValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const information = await tx.information.findUnique({
      where: {
        id,
      },
    })

    if (!information)
      return res.status(404).json({
        message: 'Information not found',
      })

    if (req.files) {
      const { attachment } = await attachmentValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Attachment (If Exist)
      if (information.attachment) {
        try {
          const photoDir = `uploads/website/information/${
            information.attachment.split('/')[0]
          }`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous attachment',
          })
        }
      }

      // New Attachment
      const uniqueFolder = `information_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/information/${uniqueFolder}/${attachment.name}`
      const filePathToSave = `${uniqueFolder}/${attachment.name}`

      attachment.mv(uploadPath, (error) => {
        if (error)
          return res.status(500).json({
            message: 'Error saving attachment',
          })
      })

      // Update file path (For saving to database)
      data.attachment = filePathToSave
    }

    await tx.information.update({
      where: { id: information.id },
      data,
    })

    res.json({
      message: 'Information updated',
    })
  })
})

/*
  @route    DELETE: /information/:id
  @access   private
  @desc     Delete and information
*/
const deleteInformation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const information = await tx.information.findUnique({
      where: {
        id,
      },
    })

    if (!information)
      return res.status(404).json({
        message: 'Information not found',
      })

    // Delete Image (If Exist)
    if (information.image) {
      try {
        const photoDir = `uploads/website/information/${
          information.image.split('/')[0]
        }`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting attachment',
        })
      }
    }

    await tx.information.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Information deleted',
    })
  })
})

module.exports = {
  getInformation,
  createInformation,
  updateInformation,
  deleteInformation,
}
