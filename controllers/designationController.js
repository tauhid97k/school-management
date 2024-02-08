const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { designationValidator } = require('../validators/designationValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /designations
  @access   private
  @desc     All designations
*/
const getAllDesignation = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [designations, total] = await prisma.$transaction([
    prisma.designations.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.designations.count(),
  ])

  res.json({
    data: designations,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /designations
  @access   private
  @desc     List a new designation
*/
const createDesignation = asyncHandler(async (req, res, next) => {
  const data = await designationValidator().validate(req.body, {
    abortEarly: false,
  })
  await prisma.designations.create({ data })

  res.status(201).json({ message: 'Designation listed successfully' })
})

/*
  @route    PUT: /designations/:id
  @access   private
  @desc     Update a designation
*/
const updateDesignation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await designationValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findDesignation = await tx.designations.findUnique({
      where: {
        id,
      },
    })

    if (!findDesignation)
      return res.status(404).json({
        message: 'No designation found',
      })

    await tx.designations.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Designation updated successfully' })
})

/*
  @route    DELETE: /designations/:id
  @access   private
  @desc     delete a designation
*/
const deleteDesignation = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findDesignation = await tx.designations.findUnique({
      where: {
        id,
      },
    })

    if (!findDesignation)
      return res.status(404).json({
        message: 'No designation found',
      })

    await tx.designations.delete({
      where: { id },
    })

    res.json({ message: 'Designation deleted successfully' })
  })
})

module.exports = {
  getAllDesignation,
  createDesignation,
  updateDesignation,
  deleteDesignation,
}
