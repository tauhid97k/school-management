const yup = require('yup')
const prisma = require('../utils/prisma')

const eventValidator = (id) =>
  yup.object({
    title: yup.string().required('Title is required'),
    image: yup.string().optional(),
    description: yup.string().optional(),
    date: yup.date().optional(),
    start_time: yup.date().optional(),
    end_time: yup.date().optional(),
  })

const eventImageValidator = () =>
  yup.object({
    image: yup
      .mixed()
      .test(
        'type',
        'Invalid file type. Only JPG, JPEG, and PNG are allowed',
        (file) => {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
          return allowedTypes.includes(file.mimetype)
        }
      )
      .test('size', 'File size is too large; max 5mb is allowed', (file) => {
        const maxSize = 5 * 1024 * 1024
        return file.size <= maxSize
      }),
  })

module.exports = { eventValidator, eventImageValidator }
