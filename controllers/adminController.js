const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /admins
  @access   private
  @desc     Get all admins
*/
const getAdmins = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [admins, total] = await prisma.$transaction([
    prisma.admins.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.admins.count(),
  ])

  res.json({
    data: admins,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

module.exports = { getAdmins }
