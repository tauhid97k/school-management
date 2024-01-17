const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { roomValidator } = require('../validators/roomValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /rooms
  @access   private
  @desc     All rooms
*/
const getAllRooms = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [rooms, total] = await prisma.$transaction([
    prisma.rooms.findMany({ take, skip, orderBy }),
    prisma.rooms.count(),
  ])

  res.json({
    data: rooms,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /rooms
  @access   private
  @desc     List a new room
*/
const createRoom = asyncHandler(async (req, res, next) => {
  const data = await roomValidator.validate(req.body, { abortEarly: false })
  await prisma.rooms.create({ data })

  res.status(201).json({ message: 'Room listed successfully' })
})

module.exports = {
  getAllRooms,
  createRoom,
}
