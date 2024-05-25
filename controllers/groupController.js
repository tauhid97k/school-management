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
  const data = await groupValidator().validate(req.body, { abortEarly: false })
  await prisma.groups.create({ data })

  res.status(201).json({ message: 'Group added successfully' })
})

/*
  @route    PUT: /groups/:id
  @access   private
  @desc     Update a group
*/
const updateGroup = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await groupValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findGroup = await tx.groups.findUnique({
      where: {
        id,
      },
    })

    if (!findGroup)
      return res.status(404).json({
        message: 'No subject found',
      })

    await tx.groups.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Group updated successfully' })
})

/*
  @route    DELETE: /group/:id
  @access   private
  @desc     delete a group
*/
const deleteGroup = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findGroup = await tx.groups.findUnique({
      where: {
        id,
      },
    })

    if (!findGroup)
      return res.status(404).json({
        message: 'No Group found',
      })

    await tx.groups.delete({
      where: { id },
    })

    res.json({ message: 'Group deleted successfully' })
  })
})

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
}
