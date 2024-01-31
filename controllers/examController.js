const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { examValidator } = require('../validators/examValidator')

/*
  @route    GET: /exams/class-sections
  @access   private
  @desc     All classes and their sections list
*/
const getAllClassesAndSections = asyncHandler(async (req, res, next) => {
  const classesAndSections = await prisma.classes.findMany({
    include: {
      sections: true,
    },
  })

  res.json({
    classesAndSections,
  })
})

/*
  @route    GET: /exams
  @access   private
  @desc     All exams list
*/
const getAllExams = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [exams, total] = await prisma.$transaction([
    prisma.exams.findMany({ take, skip, orderBy }),
    prisma.exams.count(),
  ])

  res.json({
    data: exams,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /exams
  @access   private
  @desc     Create a new exam
*/
const createExam = asyncHandler(async (req, res, next) => {
  const data = await examValidator().validate(req.body, {
    abortEarly: false,
  })

  await prisma.exams.create({ data })

  res.status(201).json({ message: 'Exam created successfully' })
})

/*
  @route    PUT: /exams/:id
  @access   private
  @desc     Update an exam
*/
const updateExam = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await examValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exam_categories.findUnique({
      where: {
        id,
      },
    })

    if (!findExam)
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
  @route    DELETE: /exams/:id
  @access   private
  @desc     delete an exam
*/
const deleteExam = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findExam = await tx.exams.findUnique({
      where: {
        id,
      },
    })

    if (!findExam)
      return res.status(404).json({
        message: 'No exam found',
      })

    await tx.exams.delete({
      where: { id },
    })

    res.json({ message: 'Exam deleted' })
  })
})

module.exports = {
  getAllClassesAndSections,
  getAllExams,
  createExam,
  updateExam,
  deleteExam,
}
