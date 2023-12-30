const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  paginateFields,
  paginateWithSorting,
} = require('../utils/transformData')
const bcrypt = require('bcrypt')
const { teacherValidator } = require('../validators/teacherValidator')

/*
  @route    GET: /teachers
  @access   private
  @desc     Get all teachers
*/
const getTeachers = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, paginateFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [teachers, total] = await prisma.$transaction([
    prisma.teachers.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.teachers.count(),
  ])

  res.json({
    data: teachers,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /teachers
  @access   private
  @desc     Create a new teacher
*/
const createTeacher = asyncHandler(async (req, res, next) => {
  const data = await teacherValidator.validate(req.body, { abortEarly: false })

  // Encrypt password
  data.password = await bcrypt.hash(data.password, 12)

  await prisma.teachers.create({
    data,
  })

  res.json({
    message: 'Teacher added',
  })
})

module.exports = { getTeachers, createTeacher }
