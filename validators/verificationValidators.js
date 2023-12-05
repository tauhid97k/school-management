const yup = require('yup')
const prisma = require('../utils/prisma')

const emailVerifyValidator = yup.object({
  code: yup
    .number()
    .required('Code is required')
    .typeError('Code Must be a number'),
  token: yup.string().required('Token is required'),
})

const passwordResetValidator = yup.object({
  role: yup
    .string()
    .required('Role is required')
    .test('exist', 'Role does not exist', async (value) => {
      const role = await prisma.roles.findUnique({
        where: {
          name: value,
        },
      })

      if (role) return true
      else return false
    }),
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
})

const resetCodeVerifyValidator = yup.object({
  code: yup
    .number()
    .required('Code is required')
    .typeError('Code Must be a number'),
  token: yup.string().required('Token is required'),
})

const passwordUpdateValidator = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

module.exports = {
  emailVerifyValidator,
  passwordResetValidator,
  resetCodeVerifyValidator,
  passwordUpdateValidator,
}
