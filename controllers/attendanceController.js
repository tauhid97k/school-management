const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  teachersAttendanceValidator,
} = require('../validators/attendanceValidator')
const {
  selectQueries,
  attendanceFields,
  paginateWithSorting,
} = require('../utils/metaData')
const dayjs = require('dayjs')
const { formatDate } = require('../utils/transformData')

/*
  @route    POST: /attendance/teachers
  @access   private
  @desc     Get All teachers for attendance
*/
const getTeachersForAttendance = asyncHandler(async (req, res, next) => {
  const selectedQueries = selectQueries(req.query, attendanceFields)
  const { page, take, skip, orderBy } = paginateWithSorting(selectedQueries)

  let { date } = selectedQueries
  date = new Date(date).toISOString()

  const [teachers, total] = await prisma.$transaction([
    prisma.teachers.findMany({
      take,
      skip,
      orderBy,
      select: {
        id: true,
        name: true,
        designation: true,
        attendance: {
          where: {
            date,
          },
        },
      },
    }),
    prisma.teachers.count(),
  ])

  const formatTeachers = teachers.map(
    ({ id, name, designation, attendance }) => ({
      id,
      name,
      designation: designation.title,
      attendance: attendance.length
        ? {
            teacher_id: attendance.at(0).teacher_id,
            status: attendance.at(0).status,
            date: formatDate(attendance.at(0).date),
          }
        : null,
    })
  )

  res.json({
    data: formatTeachers,
    meta: {
      page,
      limit: take,
      total,
    },
  })
})

/*
  @route    POST: /attendance/teachers/:id
  @access   private
  @desc     Attendance for a teacher
*/
const teacherAttendance = asyncHandler(async (req, res, next) => {
  const data = await teachersAttendanceValidator.validate(req.body, {
    abortEarly: false,
  })

  const id = Number(data.teacher_id)
  data.date = new Date(data.date).toISOString()

  await prisma.$transaction(async (tx) => {
    const existAttendance = await tx.teacher_attendance.findFirst({
      where: {
        AND: [{ teacher_id: id }, { date: data.date }],
      },
    })

    // If attendance already exist for the date then update it
    if (existAttendance) {
      await tx.teacher_attendance.update({
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
      await tx.teacher_attendance.create({
        data,
      })

      res.json({
        message: 'Done',
      })
    }
  })
})

module.exports = {
  getTeachersForAttendance,
  teacherAttendance,
}
