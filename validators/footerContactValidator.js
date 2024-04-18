const yup = require('yup')

const footerContactValidator = () =>
  yup.object({
    phone_numbers: yup
      .array(
        yup.object({
          phone: yup.string().required('Phone number is required'),
        })
      )
      .min(1),
    emails: yup
      .array(
        yup.object({
          email: yup.string().email().required('Email is required'),
        })
      )
      .min(1),
    location: yup.string().required('Location is required'),
  })

module.exports = { footerContactValidator }
