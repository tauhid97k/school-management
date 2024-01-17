const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { groupValidator } = require('../validators/groupValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /groups
  @access   private
  @desc     All groups
*/
const getAllGroups = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [groups, total] = await prisma.$transaction([
    prisma.groups.findMany({ take, skip, orderBy }),
    prisma.groups.count(),
  ])

  res.json({
    data: groups,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /groups
  @access   private
  @desc     Add a new group
*/
const createGroup = asyncHandler(async (req, res, next) => {
  const data = await groupValidator.validate(req.body, { abortEarly: false })
  await prisma.groups.create({ data })

  res.status(201).json({ message: 'Group added successfully' })
})

module.exports = {
  getAllGroups,
  createGroup,
}
