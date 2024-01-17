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

module.exports = {
  getAllSections,
  createSection,
}
