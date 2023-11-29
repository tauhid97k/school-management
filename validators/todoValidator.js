const yup = require('yup')

const todoValidator = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  isCompleted: yup.boolean().optional(),
})

module.exports = { todoValidator }
