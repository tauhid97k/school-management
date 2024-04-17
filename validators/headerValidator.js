const yup = require('yup')
const prisma = require('../utils/prisma')

const headerValidator = (id) =>
  yup.object({
    email: yup
      .string()
      .required('Email is required')
      .test('unique', 'This email already exist', async (value) => {
        const header = await prisma.header.findUnique({
          where: {
            email: value,
          },
        })

        if (header && !id) {
          return false
        }

        if (header && id) {
          if (header.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!header) {
          return true
        }
      }),
    phone: yup.string().optional(),
    image: yup.string().optional(),
  })

const headerImageValidator = () =>
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

module.exports = { headerValidator, headerImageValidator }
