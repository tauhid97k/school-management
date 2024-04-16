const yup = require('yup')

const informationValidator = (id) =>
  yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string().optional(),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE']).optional(),
    attachment: yup.string().optional(),
  })

module.exports = { informationValidator }
