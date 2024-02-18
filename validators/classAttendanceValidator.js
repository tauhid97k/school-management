const yup = require('yup')
const prisma = require('../utils/prisma')

const classAttendanceValidator = yup.object({
  class_id: yup
    .number()
    .typeError('Class id must be a number')
    .required('Class id is required')
    .test('exist', 'Class id does not exist', async (value) => {
      const findClass = await prisma.classes.findUnique({
        where: {
          id: value,
        },
      })

      if (findClass) return true
      else return false
    }),
  student_id: yup
    .number()
    .typeError('Student id must be a number')
    .required('Student id is required')
    .test('exist', 'Student id does not exist', async (value) => {
      const findStudent = await prisma.students.findUnique({
        where: {
          id: value,
        },
      })

      if (findStudent) return true
      else return false
    }),
  status: yup
    .string()
    .required('Attendance status is required')
    .oneOf(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
  date: yup.date().required(),
  note: yup.string().optional(),
})

module.exports = { classAttendanceValidator }
