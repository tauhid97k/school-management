const yup = require('yup')

const aboutValidator = () =>
  yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string().required('Description is required'),
  })

module.exports = { aboutValidator }
