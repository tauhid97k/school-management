const yup = require('yup')
const prisma = require('../utils/prisma')

const teachersAttendanceValidator = yup.object({
  teacher_id: yup
    .number()
    .typeError('Teacher id must be a number')
    .required('Teacher id is required')
    .test('exist', 'Teacher id does not exist', async (value) => {
      const findTeacher = await prisma.teachers.findUnique({
        where: {
          id: value,
        },
      })

      if (findTeacher) return true
      else return false
    }),
  status: yup
    .string()
    .required('Attendance status is required')
    .oneOf(['PRESENT', 'ABSENT', 'LATE', 'VACATION']),
  date: yup.date().required(),
  note: yup.string().optional(),
})

module.exports = { teachersAttendanceValidator }
