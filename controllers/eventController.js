const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { formatDate } = require('../utils/transformData')
const {
  eventValidator,
  eventImageValidator,
} = require('../validators/eventValidator')
const { v4: uuidV4 } = require('uuid')
const fs = require('node:fs/promises')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /events
  @access   private
  @desc     Get events
*/
const getEvents = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [events, total] = await prisma.$transaction([
    prisma.events.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.events.count(),
  ])

  const formatData = events.map(
    ({
      id,
      title,
      description,
      image,
      date,
      start_time,
      end_time,
      created_at,
      updated_at,
    }) => ({
      id,
      title,
      description,
      image: image ? generateFileLink(`website/events/${image}`) : null,
      date: date ? formatDate(date) : date,
      start_time,
      end_time,
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
  @route    POST: /events
  @access   private
  @desc     Create an event
*/
const createEvent = asyncHandler(async (req, res, next) => {
  const data = await eventValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    if (req.files) {
      const { image } = await eventImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Event Img
      const uniqueFolder = `event_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/events/${uniqueFolder}/${image.name}`
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

    await tx.events.create({
      data,
    })

    res.json({
      message: 'Event created',
    })
  })
})

/*
  @route    PUT: /events/:id
  @access   private
  @desc     Update an event
*/
const updateEvent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const data = await eventValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const event = await tx.events.findUnique({
      where: {
        id,
      },
    })

    if (!event)
      return res.status(404).json({
        message: 'Event not found',
      })

    if (req.files) {
      const { image } = await eventImageValidator().validate(req.files, {
        abortEarly: false,
      })

      // Delete Previous Image (If Exist)
      if (event.image) {
        try {
          const photoDir = `uploads/website/events/${event.image.split('/')[0]}`
          await fs.rm(photoDir, { recursive: true })
        } catch (error) {
          return res.json({
            message: 'Error deleting previous image',
          })
        }
      }

      // New Image
      const uniqueFolder = `event_${uuidV4()}_${new Date() * 1000}`
      const uploadPath = `uploads/website/events/${uniqueFolder}/${image.name}`
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

    await tx.events.update({
      where: { id: event.id },
      data,
    })

    res.json({
      message: 'Event updated',
    })
  })
})

/*
  @route    DELETE: /events/:id
  @access   private
  @desc     Delete and event
*/
const deleteEvent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const event = await tx.events.findUnique({
      where: {
        id,
      },
    })

    if (!event)
      return res.status(404).json({
        message: 'Event not found',
      })

    // Delete Image (If Exist)
    if (event.image) {
      try {
        const photoDir = `uploads/website/events/${event.image.split('/')[0]}`
        await fs.rm(photoDir, { recursive: true })
      } catch (error) {
        return res.json({
          message: 'Error deleting image',
        })
      }
    }

    await tx.events.delete({
      where: {
        id,
      },
    })

    res.json({
      message: 'event deleted',
    })
  })
})

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
}
