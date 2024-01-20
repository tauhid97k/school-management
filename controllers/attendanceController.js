const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { teacherValidator } = require('../validators/teacherValidator')

/*
  @route    PUT: /attendance/teachers/:id
  @access   private
  @desc     Attendance for a teacher
*/
const teacherAttendance = asyncHandler(async (req, res, next) => {
  const data = await teacherValidator.validate(req.body, { abortEarly: false })

  const id = Number(req.params.id)
  await prisma.$transaction(async (tx) => {
    const findTeacher = await tx.teachers.findUnique({
      where: {
        id,
      },
    })

    if (!findTeacher)
      return res.status(404).json({
        message: 'No teacher found',
      })

    // Attendance
    const today = new Date().setHours(0, 0, 0, 0)

    // ....Attendance Logic here
  })

  res.json({ message: 'Attendance updated' })
})

module.exports = {
  teacherAttendance,
}
