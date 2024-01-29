const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { roomValidator } = require('../validators/roomValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { formatDate } = require('../utils/transformData')

/*
  @route    GET: /rooms
  @access   private
  @desc     All rooms
*/
const getAllRooms = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [rooms, total] = await prisma.$transaction([
    prisma.rooms.findMany({
      take,
      skip,
      orderBy,
      include: {
        sections: {
          select: {
            section_name: true,
            class: {
              select: {
                class_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.rooms.count(),
  ])

  // Format Data
  const formatData = rooms.map((room) => ({
    id: room.id,
    room_number: room.room_number,
    section_name:
      room.sections.length > 0 ? room.sections.at(0).section_name : null,
    class_name:
      room.sections.length > 0
        ? room.sections.at(0).class
          ? room.sections.at(0).class.class_name
          : null
        : null,
    created_at: room.created_at,
    updated_at: room.updated_at,
  }))

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
  @route    GET: /rooms/:id
  @access   private
  @desc     Get a room details
*/
const getRoom = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findRoom = await prisma.rooms.findUnique({
    where: {
      id,
    },
    include: {
      sections: {
        select: {
          section_name: true,
          class: {
            select: {
              id: true,
              class_name: true,
            },
          },
        },
      },
    },
  })

  if (!findRoom)
    return res.status(404).json({
      message: 'No room found',
    })

  const formatData = {
    id: findRoom.id,
    room_number: findRoom.room_number,
    section_name:
      findRoom.sections.length > 0
        ? findRoom.sections.at(0).section_name
        : null,
    class_name:
      findRoom.sections.length > 0
        ? findRoom.sections.at(0).class
          ? findRoom.sections.at(0).class.class_name
          : null
        : null,
    created_at: findRoom.created_at,
    updated_at: findRoom.updated_at,
  }

  res.json(formatData)
})

/*
  @route    POST: /rooms
  @access   private
  @desc     List a new room
*/
const createRoom = asyncHandler(async (req, res, next) => {
  const data = await roomValidator().validate(req.body, { abortEarly: false })
  await prisma.rooms.create({ data })

  res.status(201).json({ message: 'Room listed successfully' })
})

/*
  @route    PUT: /rooms/:id
  @access   private
  @desc     Update a room
*/
const updateRoom = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await roomValidator(id).validate(req.body, { abortEarly: false })

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
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
}
