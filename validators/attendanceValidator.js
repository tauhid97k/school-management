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
  attendance: yup.array().of(
    yup.object({
      status: yup
        .string()
        .oneOf(['PRESENT', 'ABSENCE', 'LATE', 'VACATION', 'UNKNOWN']),
      date: yup.string(),
      note: yup.string().optional(),
    })
  ),
})

module.exports = { teachersAttendanceValidator }
