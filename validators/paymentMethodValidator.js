const yup = require('yup')
const prisma = require('../utils/prisma')

const paymentMethodValidator = (id) =>
  yup.object({
    name: yup
      .string()
      .required('Name is required')
      .test('unique', 'This name already exist', async (value) => {
        const paymentMethod = await prisma.payment_methods.findUnique({
          where: {
            name: value,
          },
        })

        if (paymentMethod && !id) {
          return false
        }

        if (paymentMethod && id) {
          if (paymentMethod.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!paymentMethod) {
          return true
        }
      }),
    image: yup.string().optional(),
    status: yup.string().oneOf(['ACTIVE', 'INACTIVE']).optional(),
  })

const paymentMethodImageValidator = () =>
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
      .test('size', 'File size is too large; max 2mb is allowed', (file) => {
        const maxSize = 2 * 1024 * 1024
        return file.size <= maxSize
      }),
  })

module.exports = { paymentMethodValidator, paymentMethodImageValidator }
