const yup = require('yup')
const prisma = require('../utils/prisma')

const noticeValidator = yup.object({
  title: yup.string().required('title is required'),
  description: yup.string().required('description is required'),
  recipient_id: yup
    .number()
    .typeError('Recipient id must be a number')
    .required('Recipient id is required'),
  recipient_type: yup
    .string()
    .required('Recipient type is required')
    .oneOf(['ALL', 'TEACHERS', 'STUDENTS']),
})

const classNoticeValidator = yup.object({
  title: yup.string().required('title is required'),
  description: yup.string().required('description is required'),
  class_id: yup
    .number()
    .typeError('Class id must be a number')
    .required('Class id is required')
    .test('exist', 'No class found with this id', async (value) => {
      const findClass = await prisma.classes.findUnique({
        where: {
          id: value,
        },
      })

      if (findClass) return true
      else return false
    }),
})

module.exports = { noticeValidator, classNoticeValidator }
