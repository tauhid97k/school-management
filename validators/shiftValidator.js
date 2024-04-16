const yup = require('yup')
const prisma = require('../utils/prisma')

const shiftValidator = (id) =>
  yup.object({
    title: yup
      .string()
      .required('Title is required')
      .test('unique', 'This title already exist', async (value) => {
        const shift = await prisma.shift.findUnique({
          where: {
            name: value,
          },
        })

        if (shift && !id) {
          return false
        }

        if (shift && id) {
          if (shift.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!shift) {
          return true
        }
      }),
    description: yup.string().optional(),
    image: yup.string().optional(),
    visibility: yup.bool().default(true),
  })

const shiftImageValidator = () =>
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

module.exports = { shiftValidator, shiftImageValidator }
