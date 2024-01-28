const prisma = require('../utils/prisma')
const asyncHandler = require('express-async-handler')
const {
  selectQueries,
  commonFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { studentValidator } = require('../validators/studentValidator')
const bcrypt = require('bcrypt')
const dayjs = require('dayjs')
const excludeFields = require('../utils/excludeFields')
const { formatDate } = require('../utils/transformData')

/*
  @route    GET: /students
  @access   private
  @desc     Get all students
*/
const getStudents = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, commonFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [students, total] = await prisma.$transaction([
    prisma.students.findMany({
      take,
      skip,
      orderBy,
    }),
    prisma.students.count(),
  ])

  res.json({
    data: students,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /students/:id
  @access   private
  @desc     Get student details
*/

const getStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)
  const findStudent = await prisma.students.findUnique({
    where: {
      id,
    },
    include: {
      class: true,
    },
  })

  if (!findStudent)
    return res.status(404).json({
      message: 'No student found',
    })

  // Correct date format
  findStudent.date_of_birth = formatDate(findStudent.date_of_birth)
  findStudent.admission_date = formatDate(findStudent.admission_date)

  // Exclude password field
  const dataWithExcludeFields = excludeFields(findStudent, [
    'class_id',
    'password',
  ])

  // Format Data
  const formatData = {
    ...findStudent,
    class_name: findStudent.class.class_name,
  }

  // Remove the original "class" property
  delete formatData.class

  res.json(formatData)
})

/*
  @route    POST: /students
  @access   private
  @desc     Create a new student
*/
const createStudent = asyncHandler(async (req, res, next) => {
  let data = await studentValidator().validate(req.body, { abortEarly: false })

  // Encrypt password
  data.password = await bcrypt.hash(data.password, 12)

  // Correct date format
  data.date_of_birth = dayjs(data.date_of_birth).toISOString()
  data.admission_date = dayjs(data.admission_date).toISOString()

  await prisma.students.create({
    data,
  })

  res.json({
    message: 'Student added',
  })
})

/*
  @route    PUT: /students/:id
  @access   private
  @desc     Update a student
*/
const updateStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const data = await studentValidator(id).validate(req.body, {
    abortEarly: false,
  })

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent)
      return res.status(404).json({
        message: 'No student found',
      })

    // Encrypt password
    data.password = await bcrypt.hash(data.password, 12)

    // Correct date format
    data.date_of_birth = dayjs(data.date_of_birth).toISOString()
    data.admission_date = dayjs(data.admission_date).toISOString()

    await tx.students.update({
      where: { id },
      data,
    })
  })

  res.json({ message: 'Student updated successfully' })
})

/*
  @route    DELETE: /students/:id
  @access   private
  @desc     delete a student
*/
const deleteStudent = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  await prisma.$transaction(async (tx) => {
    const findStudent = await tx.students.findUnique({
      where: {
        id,
      },
    })

    if (!findStudent)
      return res.status(404).json({
        message: 'No student found',
      })

    await tx.students.delete({
      where: { id },
    })

    res.json({ message: 'Student data removed' })
  })
})

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
}
