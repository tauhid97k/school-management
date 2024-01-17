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

/*
  @route    PUT: /rooms/:id
  @access   private
  @desc     Update a room
*/
const updateRoom = asyncHandler(async (req, res, next) => {
  const data = await roomValidator.validate(req.body, { abortEarly: false })

  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findRoom = await tx.rooms.findUnique({
      where: {
        id,
      },
    })

    if (!findRoom)
      return res.status(404).json({
        message: 'No room found',
      })

    await tx.rooms.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Room updated successfully' })
})

/*
  @route    DELETE: /rooms/:id
  @access   private
  @desc     delete a room
*/
const deleteRoom = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findRoom = await tx.rooms.findUnique({
      where: {
        id,
      },
    })

    if (!findRoom)
      return res.status(404).json({
        message: 'No Group found',
      })

    await tx.rooms.delete({
      where: { id },
    })

    res.json({ message: 'Room deleted successfully' })
  })
})

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
}
