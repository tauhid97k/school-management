const yup = require('yup')
const prisma = require('../utils/prisma')

const teacherApplicationValidator = () =>
  yup.object({
    teacher_id: yup
      .number()
      .typeError('Teacher id must be a number')
      .required('Teacher is required')
      .test('exist', 'Teacher does not exist', async (value) => {
        const findTeacher = await prisma.teachers.findUnique({
          where: {
            id: value,
          },
        })

        if (findTeacher) return true
        else return false
      }),
    subject: yup.string().required('Subject is required'),
    description: yup.string().required('Description is required'),
    date: yup.date().required('Date is required'),
    comment: yup.string().optional(),
    attachment: yup.string().optional(),
  })

const studentApplicationValidator = () =>
  yup.object({
    student_id: yup
      .number()
      .typeError('Teacher id must be a number')
      .required('Teacher is required')
      .test('exist', 'Teacher does not exist', async (value) => {
        const findTeacher = await prisma.teachers.findUnique({
          where: {
            id: value,
          },
        })

        if (findTeacher) return true
        else return false
      }),
    subject: yup.string().required('Subject is required'),
    description: yup.string().required('Description is required'),
    date: yup.date().required('Date is required'),
    comment: yup.string().optional(),
    attachment: yup.string().optional(),
  })

module.exports = { teacherApplicationValidator, studentApplicationValidator }
