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
    prisma.sections.findMany({
      take,
      skip,
      orderBy,
      include: {
        room: true,
        class: true,
      },
    }),
    prisma.sections.count(),
  ])

  // Format Data
  const formatData = sections.map((section) => ({
    id: section.id,
    section_name: section.section_name,
    room_number: section?.room ? section.room.room_number : null,
    class_name: section.class.class_name,
    created_at: section.created_at,
    updated_at: section.updated_at,
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
  @route    GET: /sections/:id
  @access   private
  @desc     Get a section details
*/
const getSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findSection = await prisma.sections.findUnique({
    where: {
      id,
    },
    include: {
      class: true,
      room: true,
    },
  })

  if (!findSection)
    return res.status(404).json({
      message: 'No section found',
    })

  const formatData = {
    id: findSection.id,
    section_name: findSection.section_name,
    room_id: findSection.room_id,
    room_number: findSection?.room ? findSection.room.room_number : null,
    class_id: findSection.class_id,
    class_name: findSection.class.class_name,
    created_at: findSection.created_at,
    updated_at: findSection.updated_at,
  }

  res.json(formatData)
})

/*
  @route    POST: /sections
  @access   private
  @desc     Add a new section
*/
const createSection = asyncHandler(async (req, res, next) => {
  const data = await sectionValidator().validate(req.body, {
    abortEarly: false,
  })
  await prisma.sections.create({ data })

  res.status(201).json({ message: 'Section added successfully' })
})

/*
  @route    PUT: /sections/:id
  @access   private
  @desc     Update a section
*/
const updateSection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await sectionValidator(id).validate(req.body, {
    abortEarly: false,
  })

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
  getSection,
  createSection,
  updateSection,
  deleteSection,
}
