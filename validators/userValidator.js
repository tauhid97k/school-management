const yup = require('yup')
const prisma = require('../utils/prisma')

const userValidator = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Email is invalid').required('Email is required'),
  phone_number: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
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
