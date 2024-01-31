const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { examCategoryValidator } = require('../validators/examCategoryValidator')

/*
  @route    GET: /exam-categories
  @access   private
  @desc     All exam categories
*/
const getAllExamCategory = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [exam_categories, total] = await prisma.$transaction([
    prisma.exam_categories.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.exam_categories.count(),
  ])

  res.json({
    data: exam_categories,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /exam-categories
  @access   private
  @desc     Add a new exam category
*/
const createExamCategory = asyncHandler(async (req, res, next) => {
  const data = await examCategoryValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.exam_categories.create({ data })

  res.status(201).json({ message: 'Exam category added' })
})

/*
  @route    PUT: /exam-categories/:id
  @access   private
  @desc     Update a exam category
*/
const updateExamCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await examCategoryValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findExamCategory = await tx.exam_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findExamCategory)
      return res.status(404).json({
        message: 'No exam category found',
      })

    await tx.exam_categories.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Exam category updated' })
})

/*
  @route    DELETE: /exam-categories/:id
  @access   private
  @desc     delete an exam category
*/
const deleteExamCategory = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findExamCategory = await tx.exam_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findExamCategory)
      return res.status(404).json({
        message: 'No exam category found',
      })

    await tx.exam_categories.delete({
      where: { id },
    })

    res.json({ message: 'Exam category deleted' })
  })
})

module.exports = {
  getAllExamCategory,
  createExamCategory,
  updateExamCategory,
  deleteExamCategory,
}
