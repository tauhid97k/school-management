const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const bcrypt = require('bcrypt')
const { teacherValidator } = require('../validators/teacherValidator')
const dayjs = require('dayjs')

/*
  @route    GET: /teachers
  @access   private
  @desc     Get all teachers
*/
const getTeachers = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
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
  let data = await teacherValidator.validate(req.body, { abortEarly: false })

  // Encrypt password
  data.password = await bcrypt.hash(data.password, 12)

  // Correct date format
  data.date_of_birth = dayjs(data.date_of_birth).toISOString()
  data.joining_date = dayjs(data.joining_date).toISOString()

  await prisma.teachers.create({
    data,
  })

  res.json({
    message: 'Teacher added',
  })
})

module.exports = { getTeachers, createTeacher }
