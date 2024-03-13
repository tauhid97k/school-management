const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { studentFeesValidator } = require('../validators/studentFeesValidator')
const {
  selectQueries,
  studentFeesFields,
  paginateWithSorting,
} = require('../utils/metaData')
const { formatDate } = require('../utils/transformData')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /student-fees/classes/:id/students
  @access   private
  @desc     Get All students for fee
*/
const getStudentsForFee = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, studentFeesFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { date } = selectedQueries

  if (!date) {
    return res.status(400).json({
      message: 'Date is required',
    })
  }

  date = new Date(date).toISOString()

  const id = Number(req.params.id)

  const [students, total] = await prisma.$transaction([
    prisma.students.findMany({
      where: {
        class_id: id,
      },
      take,
      skip,
      orderBy,
      select: {
        id: true,
        name: true,
        roll: true,
        profile_img: true,
        class: {
          select: {
            class_name: true,
          },
        },
        section: {
          select: {
            section_name: true,
          },
        },
      },
    }),
    prisma.students.count(),
  ])

  const formatStudents = students.map(
    ({ id, name, roll, profile_img, class: studentClass, section }) => ({
      id,
      name,
      roll,
      profile_img: profile_img
        ? generateFileLink(`students/profiles/${findStudent.profile_img}`)
        : null,
      class_name: studentClass.class_name,
      section_name: section.section_name,
    })
  )

  res.json({
    data: formatStudents,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /student-fees
  @access   private
  @desc     Get All fee list
*/
const studentFeeList = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, studentFeesFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  const [studentFees, total] = await prisma.$transaction([
    prisma.student_fees.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            profile_img: true,
            class: {
              select: {
                class_name: true,
              },
            },
            section: {
              select: {
                section_name: true,
              },
            },
          },
        },
      },
      take,
      skip,
      orderBy,
    }),
    prisma.student_fees.count(),
  ])

  // Format Student Fees
  const formatStudentFees = studentFees.map((fee) => {
    const { student, ...rest } = fee
    return {
      ...rest,
      name: student.name,
      roll: student.roll,
      profile_img: student.profile_img
        ? generateFileLink(`students/profiles/${student.profile_img}`)
        : null,
      class_name: student.class.class_name,
      section_name: student.section.section_name,
    }
  })

  res.json({
    data: formatStudentFees,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    GET: /student-fees
  @access   private
  @desc     Get fee details
*/
const studentFeeDetails = asyncHandler(async (req, res, next) => {})

/*
  @route    POST: /student-fees
  @access   private
  @desc     Create student fee
*/
const createStudentFee = asyncHandler(async (req, res, next) => {
  console.log('before')
  const data = await studentFeesValidator().validate(req.body, {
    abortEarly: false,
  })
  console.log('after')

  await prisma.student_fees.create({
    data,
  })

  res.json({
    message: 'Student fee added',
  })
})

module.exports = { getStudentsForFee, studentFeeList, createStudentFee }
