const yup = require('yup')
const prisma = require('../utils/prisma')

const studentHomeworkValidator = () =>
  yup.object({
    student_id: yup
      .number()
      .typeError('Student id must be number')
      .required('Student is required')
      .test('exists', 'Student does not exist', async (value) => {
        const findStudent = await prisma.students.findUnique({
          where: {
            id: value,
          },
        })

        if (findStudent) return true
        else return false
      }),
    assignment_id: yup
      .number()
      .typeError('Assignment id must be number')
      .required('Assignment is required')
      .test('exists', 'Assignment does not exist', async (value) => {
        const findAssignment = await prisma.teacher_assignments.findUnique({
          where: {
            id: value,
          },
        })

        if (findAssignment) return true
        else return false
      }),
    description: yup.string().optional(),
    attachment: yup.string().optional(),
  })

module.exports = { studentHomeworkValidator }
