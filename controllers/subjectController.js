const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { subjectValidator } = require('../validators/subjectValidator')
const {
  selectQueries,
  paginateFields,
  paginateWithSorting,
} = require('../utils/transformData')

/*
  @route    GET: /subjects
  @access   private
  @desc     All subjects
*/
const getAllSubjects = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, paginateFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [subjects, total] = await prisma.$transaction([
    prisma.subjects.findMany({ take, skip, orderBy }),
    prisma.subjects.count(),
  ])

  res.json({
    data: subjects,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /subjects/:id
  @access   private
  @desc     Get a subject details
*/
const getSubject = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findSubject = await prisma.subjects.findUnique({
    where: {
      id,
    },
  })

  if (!findSubject)
    return res.status(404).json({
      message: 'No Subject found',
    })

  res.json(findSubject)
})

/*
  @route    POST: /subjects
  @access   private
  @desc     Create a new subject
*/
const createSubject = asyncHandler(async (req, res, next) => {
  const data = await subjectValidator.validate(req.body, { abortEarly: false })
  await prisma.subjects.create({ data })

  res.status(201).json({ message: 'Subject created successfully' })
})

/*
  @route    PUT: /subjects/:id
  @access   private
  @desc     Update a subject
*/
const updateSubject = asyncHandler(async (req, res, next) => {
  const data = await subjectValidator.validate(req.body, { abortEarly: false })

  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findSubject = await tx.subjects.findUnique({
      where: {
        id,
      },
    })

    if (!findSubject)
      return res.status(404).json({
        message: 'No subject found',
      })

    await tx.subjects.update({
      where: { id },
      data,
    })
  })

  res.status(201).json({ message: 'Subject updated successfully' })
})

/*
  @route    DELETE: /subjects/:id
  @access   private
  @desc     delete a class
*/
const deleteSubject = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findSubject = await tx.subjects.findUnique({
      where: {
        id,
      },
    })

    if (!findSubject)
      return res.status(404).json({
        message: 'No Subject found',
      })

    await tx.subjects.delete({
      where: { id },
    })

    res.status(201).json({ message: 'Subject deleted successfully' })
  })
})

module.exports = {
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
}
