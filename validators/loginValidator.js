const yup = require('yup')
const prisma = require('../utils/prisma')

const loginValidator = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Email is invalid')
    .test('exist', 'Email does not exist', async (value, ctx) => {
      const role = ctx.parent.role
      let email

      // Check School Admin
      if (role === 'admin') {
        email = await prisma.admins.findUnique({
          where: {
            email: value,
          },
        })
      }

      // Check Teacher
      if (role === 'teacher') {
        email = await prisma.teachers.findUnique({
          where: {
            email: value,
          },
        })
      }

      // Check Student
      if (role === 'student') {
        email = await prisma.students.findUnique({
          where: {
            email: value,
          },
        })
      }

      if (email) return true
      else return false
    }),
  password: yup.string().required('Password is required'),
  role: yup.string().required('Role is required'),
})

module.exports = loginValidator
