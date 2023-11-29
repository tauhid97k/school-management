const yup = require('yup')
const prisma = require('../utils/prisma')

const loginValidator = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Email is invalid')
    .test('exist', 'Email does not exist', async (value) => {
      const email = await prisma.users.findUnique({
        where: {
          email: value,
        },
      })

      if (email) return true
      else return false
    }),
  password: yup.string().required('Password is required'),
})

module.exports = loginValidator
