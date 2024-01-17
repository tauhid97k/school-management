const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { sectionValidator } = require('../validators/sectionValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /sections
  @access   private
  @desc     All sections
*/
const getAllSections = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [sections, total] = await prisma.$transaction([
    prisma.sections.findMany({ take, skip, orderBy }),
    prisma.sections.count(),
  ])

  res.json({
    data: sections,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /sections
  @access   private
  @desc     Add a new section
*/
const createSection = asyncHandler(async (req, res, next) => {
  const data = await sectionValidator.validate(req.body, { abortEarly: false })
  await prisma.sections.create({ data })

  res.status(201).json({ message: 'Room listed successfully' })
})

/*
  @route    PUT: /sections/:id
  @access   private
  @desc     Update a section
*/
const updateSection = asyncHandler(async (req, res, next) => {
  const data = await sectionValidator.validate(req.body, { abortEarly: false })

  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findSection = await tx.sections.findUnique({
      where: {
        id,
      },
    })

    if (!findSection)
      return res.status(404).json({
        message: 'No subject found',
      })

    await tx.sections.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Section updated successfully' })
})

/*
  @route    DELETE: /sections/:id
  @access   private
  @desc     delete a section
*/
const deleteSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSection = await tx.sections.findUnique({
      where: {
        id,
      },
    })

    if (!findSection)
      return res.status(404).json({
        message: 'No Section found',
      })

    await tx.sections.delete({
      where: { id },
    })

    res.json({ message: 'Section deleted successfully' })
  })
})

module.exports = {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
}
