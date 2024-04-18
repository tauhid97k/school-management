const yup = require('yup')

const contactValidator = () =>
  yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    subject: yup.string().required('Subject is required'),
    message: yup.string().required('Message is required'),
  })

module.exports = { contactValidator }
