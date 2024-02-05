const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { gradingValidator } = require('../validators/gradingValidator')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')

/*
  @route    GET: /exam-grades
  @access   private
  @desc     All Grades
*/
const getAllGrades = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [grades, total] = await prisma.$transaction([
    prisma.grades.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.grades.count(),
  ])

  res.json({
    data: grades,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /grades/:id
  @access   private
  @desc     Get a grade details
*/
const getGrade = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findGrade = await prisma.grades.findUnique({
    where: {
      id,
    },
  })

  if (!findGrade)
    return res.status(404).json({
      message: 'No grade found',
    })

  res.json(findGrade)
})

/*
  @route    POST: /grades
  @access   private
  @desc     List a new grade
*/
const createGrade = asyncHandler(async (req, res, next) => {
  const data = await gradingValidator().validate(req.body, {
    abortEarly: false,
  })
  await prisma.grades.create({ data })

  res.status(201).json({ message: 'Grade created successfully' })
})

/*
  @route    PUT: /grades/:id
  @access   private
  @desc     update a grade
*/
const updateGrade = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await gradingValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findGrade = await tx.grades.findUnique({
      where: {
        id,
      },
    })

    if (!findGrade)
      return res.status(404).json({
        message: 'No grade found',
      })

    await tx.grades.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Grade updated successfully' })
})

/*
  @route    DELETE: /grades/:id
  @access   private
  @desc     delete a grade
*/
const deleteGrade = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findGrade = await tx.grades.findUnique({
      where: {
        id,
      },
    })

    if (!findGrade)
      return res.status(404).json({
        message: 'No grade found',
      })

    await tx.grades.delete({
      where: { id },
    })

    res.json({ message: 'Grade deleted successfully' })
  })
})

module.exports = {
  getAllGrades,
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
}
