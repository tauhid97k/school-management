const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  classAttendanceValidator,
} = require('../validators/classAttendanceValidator')
const {
  selectQueries,
  attendanceFields,
  paginateWithSorting,
} = require('../utils/metaData')
const dayjs = require('dayjs')
const { formatDate } = require('../utils/transformData')
const generateFileLink = require('../utils/generateFileLink')

/*
  @route    GET: /attendance/classes/:id/students
  @access   private
  @desc     Get All students for attendance
*/
const getStudentsForAttendance = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, attendanceFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { date } = selectedQueries
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
        profile_img: true,
        roll: true,
        class_id: true,
        class_attendance: {
          where: {
            date,
          },
        },
      },
    }),
    prisma.students.count({
      where: {
        class_id: id,
      },
    }),
  ])

  const formatStudents = students.map(
    ({ id, name, roll, class_id, class_attendance, profile_img }) => ({
      id,
      name,
      profile_img: profile_img
        ? generateFileLink(`students/profiles/${profile_img}`)
        : null,
      roll,
      class_id,
      attendance: class_attendance.length
        ? {
            student_id: class_attendance.at(0).student_id,
            status: class_attendance.at(0).status,
            date: formatDate(class_attendance.at(0).date),
          }
        : null,
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
  @route    GET: /attendance/students/:id
  @access   private
  @desc     Get a student's attendance details 
*/
const getStudentAttendanceDetails = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id)

  const findStudentAttendance = await prisma.class_attendance.findMany({
    where: {
      student_id: id,
    },
  })

  if (!findStudentAttendance)
    return res.status(404).json({
      message: 'No student found',
    })

  const formatData = findStudentAttendance.map(({ status, date }) => ({
    title: status,
    start: dayjs(date).format('YYYY, M, D'),
    end: dayjs(date).format('YYYY, M, D'),
  }))

  res.json(formatData)
})

/*
  @route    POST: /attendance/students/:id
  @access   private
  @desc     Attendance for a student
*/
const createStudentAttendance = asyncHandler(async (req, res, next) => {
  const data = await classAttendanceValidator.validate(req.body, {
    abortEarly: false,
  })

  const id = Number(data.student_id)
  data.date = new Date(data.date).toISOString()

  await prisma.$transaction(async (tx) => {
    const existAttendance = await tx.class_attendance.findFirst({
      where: {
        AND: [{ student_id: id }, { date: data.date }],
      },
    })

    // If attendance already exist for the date then update it
    if (existAttendance) {
      await tx.class_attendance.update({
        where: {
          id: existAttendance.id,
        },
        data,
      })

      res.json({
        message: 'Attendance updated',
      })
    } else {
      // Create new attendance (If not exist)
      await tx.class_attendance.create({
        data,
      })

      res.json({
        message: 'Done',
      })
    }
  })
})

module.exports = {
  getStudentsForAttendance,
  getStudentAttendanceDetails,
  createStudentAttendance,
}
