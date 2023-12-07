const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { classValidator } = require('../validators/classValidator')
const paginateWithSortingData = require('../utils/paginateData')

/*
  @route    GET: /classes
  @access   private
  @desc     All classes
*/
const getAllClasses = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const sortBy = req.query.sortBy
  const sortOrder = req.query.sortOrder

  const queries = paginateWithSortingData(page, limit, sortBy, sortOrder)

  const [classes, total] = await prisma.$transaction([
    prisma.classes.findMany({ ...queries }),
    prisma.classes.count(),
  ])

  res.json({
    data: classes,
    total,
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
  getClass,
  createClass,
  updateClass,
  deleteClass,
}
