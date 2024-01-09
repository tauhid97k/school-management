const yup = require('yup')
const prisma = require('../utils/prisma')

const noticeValidator = yup.object({
  title: yup.string().required('title is required'),
  description: yup.string().required('description is required'),
  recipient_type: yup
    .string()
    .required('Recipient type is required')
    .oneOf(['ALL', 'TEACHERS', 'CLASSES']),
  recipient_ids: yup
    .array(yup.number().typeError('Only number is allowed'))
    .when('recipient_type', {
      is: (values) => ['TEACHERS', 'CLASSES'].includes(values),
      then: (schema) =>
        schema
          .required(`Recipient Id's are required`)
          .min(1)
          .test('exist', 'One or more id is invalid', async (values, ctx) => {
            const noticeType = ctx.parent.recipient_type
            let checkIds

            if (noticeType === 'TEACHERS') {
              checkIds = await prisma.teachers.findMany({
                where: {
                  id: {
                    in: values,
                  },
                },
              })
            } else if (noticeType === 'CLASSES') {
              checkIds = await prisma.classes.findMany({
                where: {
                  id: {
                    in: values,
                  },
                },
              })
            }

            if (checkIds.length === values.length) return true
            else return false
          }),
      otherwise: (schema) => schema.optional(),
    }),
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
