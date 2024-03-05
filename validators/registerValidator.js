const yup = require('yup')
const prisma = require('../utils/prisma')

const registerValidator = yup.object({
  name: yup.string().required('Admin name is required'),
  email: yup
    .string()
    .required('Admin email is required')
    .email('Email is invalid')
    .test('unique', 'This email already exist', async (value) => {
      const email = await prisma.admins.findUnique({
        where: {
          email: value,
        },
      })

      if (email) return false
      else return true
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  profile_img: yup.string().optional(),
  designation: yup.string().required('Designation is required'),
  school_name: yup
    .string()
    .required('School name is required')
    .test('unique', 'School name already exist', async (value) => {
      const findSchool = await prisma.admins.findUnique({
        where: {
          school_name: value,
        },
      })

      return findSchool ? false : true
    }),
  school_address: yup.string().required('School address is required'),
})

module.exports = registerValidator
