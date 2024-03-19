const yup = require('yup')
const prisma = require('../utils/prisma')

const loginValidator = yup.object({
  role: yup
    .string()
    .required('Role is required')
    .test('exist', 'Role does not exist', async (value) => {
      const role = await prisma.roles.findUnique({
        where: {
          name: value,
        },
      })

      if (role || value === 'staff') return true
      else return false
    }),
  email: yup
    .string()
    .required('Email is required')
    .email('Email is invalid')
    .test('exist', 'Email does not exist', async (value, ctx) => {
      const role = ctx.parent.role
      let email

      if (!role) {
        throw new yup.ValidationError('Role is required', role, 'role')
      }

      // Check School Admin
      if (role === 'admin') {
        email = await prisma.admins.findUnique({
          where: {
            email: value,
          },
        })
      } else if (role === 'teacher') {
        email = await prisma.teachers.findUnique({
          where: {
            email: value,
          },
        })
      } else if (role === 'student') {
        email = await prisma.students.findUnique({
          where: {
            email: value,
          },
        })
      } else if (role === 'staff') {
        email = await prisma.staffs.findUnique({
          where: {
            email: value,
          },
        })
      }

      if (email) return true
      else return false
    }),
  password: yup.string().required('Password is required'),
})

module.exports = loginValidator
