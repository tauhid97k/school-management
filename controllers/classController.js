const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { classValidator } = require('../validators/classValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /classes
  @access   private
  @desc     All classes
*/
const getAllClasses = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [classes, total] = await prisma.$transaction([
    prisma.classes.findMany({ take, skip, orderBy }),
    prisma.classes.count(),
  ])

  res.json({
    data: classes,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /classes/:id/sections
  @access   private
  @desc     Get all sections of a class
*/
const getClassSections = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findClass = await tx.classes.findUnique({
      where: {
        id,
      },
    })

    if (!findClass) {
      return res.status(404).json({ message: 'No class found' })
    }

    const sections = await tx.sections.findMany({
      where: {
        class_id: id,
      },
    })

    res.json(sections)
  })
})

/*
  @route    GET: /classes/:id/subjects
  @access   private
  @desc     Get all subjects of a class
*/
const getClassSubjects = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findClass = await tx.classes.findUnique({
      where: {
        id,
      },
    })

    if (!findClass) {
      return res.status(404).json({ message: 'No class found' })
    }

    const subjects = await tx.subjects.findMany({
      where: {
        class_id: id,
      },
      include: {
        subject_class: {
          select: {
            id: true,
            class_name: true,
          },
        },
      },
    })

    const formatData = subjects.map(({ id, name, subject_class }) => ({
      subject_id: id,
      subject_name: name,
      class_id: subject_class.id,
      class_name: subject_class.class_name,
    }))

    res.json(formatData)
  })
})

/*
  @route    GET: /classes/:id
  @access   private
  @desc     Get a class details
*/
const getClass = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findClass = await prisma.classes.findUnique({
    where: {
      id,
    },
  })

  if (!findClass)
    return res.status(404).json({
      message: 'No class found',
    })

  res.json(findClass)
})

/*
  @route    POST: /classes
  @access   private
  @desc     Create a new class
*/
const createClass = asyncHandler(async (req, res, next) => {
  const data = await classValidator.validate(req.body, { abortEarly: false })
  await prisma.classes.create({ data })

  res.status(201).json({ message: 'Class created successfully' })
})

/*
  @route    PUT: /classes/:id
  @access   private
  @desc     Update a class
*/
const updateClass = asyncHandler(async (req, res, next) => {
  const data = await classValidator.validate(req.body, { abortEarly: false })

  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findClass = await tx.classes.findUnique({
      where: {
        id,
      },
    })

    if (!findClass)
      return res.status(404).json({
        message: 'No class found',
      })

    await tx.classes.update({
      where: { id },
      data,
    })
  })

  res.status(201).json({ message: 'Class updated successfully' })
})

/*
  @route    DELETE: /classes/:id
  @access   private
  @desc     delete a class
*/
const deleteClass = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findClass = await tx.classes.findUnique({
      where: {
        id,
      },
    })

    if (!findClass)
      return res.status(404).json({
        message: 'No class found',
      })

    await tx.classes.delete({
      where: { id },
    })

    res.status(201).json({ message: 'Class deleted successfully' })
  })
})

module.exports = {
  getAllClasses,
  getClassSections,
  getClassSubjects,
  getClass,
  createClass,
  updateClass,
  deleteClass,
}
