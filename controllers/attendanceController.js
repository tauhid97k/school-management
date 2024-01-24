const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const {
  teachersAttendanceValidator,
} = require('../validators/attendanceValidator')

/*
  @route    POST: /attendance/teachers/:id
  @access   private
  @desc     Attendance for a teacher
*/
const teacherAttendance = asyncHandler(async (req, res, next) => {
  const data = await teachersAttendanceValidator.validate(req.body, {
    abortEarly: false,
  })

  const id = data.teacher_id

  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher) {
      return res.status(404).json({
        message: 'No teacher found',
      })
    }

    // Get the current date in ISO 8601 format
    const currentDate = new Date().toISOString()

    console.log(currentDate)

    const existAttendance = await tx.teacher_attendance.findFirst({
      where: {
        AND: [{ teacher_id: id }, { date: currentDate }],
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
      const r = await tx.teacher_attendance.create({
        data: {
          teacher_id: findTeacher.id,
          ...data,
        },
      })

      console.log(r.date)

      res.json({
        message: 'Done',
      })
    }
  })
})

module.exports = {
  teacherAttendance,
}
