const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const {
  shiftValidator,
  shiftImageValidator,
} = require('../validators/shiftValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /shift
  @access   private
  @desc     Get shifts
*/
const getShifts = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [shift, total] = await prisma.$transaction([
    prisma.shift.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.shift.count(),
  ])

  const formatData = shift.map(
    ({
      id,
      title,
      description,
      image,
      visibility,
      created_at,
      updated_at,
    }) => ({
      id,
      title,
      description,
      visibility,
      image: image ? generateFileLink(`website/shift/${image}`) : null,
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
  @route    POST: /shift
  @access   private
  @desc     Create shift
*/
const createShift = asyncHandler(async (req, res, next) => {
  const data = await shiftValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { image } = await shiftImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Shift banner Img
      const uniqueFolder = `shift_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/shift/${uniqueFolder}/${image.name}`
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

    await tx.shift.create({
      data,
    })

    res.json({
      message: 'Shift added',
    })
  })
})

/*
  @route    PUT: /shift/:id
  @access   private
  @desc     Update a shift
*/
const updateShift = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await shiftValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: {
        id,
      },
    })

    if (!shift)
      return res.status(404).json({
        message: 'No shift found',
      })

    if (req.files) {
      const { image } = await shiftImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Image (If Exist)
      if (shift.image) {
        try {
          const photoDir = `uploads/website/shift/${shift.image.split('/')[0]}`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `shift_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/shift/${uniqueFolder}/${image.name}`
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

    await tx.shift.update({
      where: { id: shift.id },
      data,
    })

    res.json({
      message: 'Shift updated',
    })
  })
})

/*
  @route    DELETE: /shift/:id
  @access   private
  @desc     Delete a shift
*/
const deleteShift = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: {
        id,
      },
    })

    if (!shift)
      return res.status(404).json({
        message: 'No shift found',
      })

    // Delete Image (If Exist)
    if (shift.image) {
      try {
        const photoDir = `uploads/website/shift/${shift.image.split('/')[0]}`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.shift.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'Shift deleted',
    })
  })
})

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
}
