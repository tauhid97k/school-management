const yup = require('yup')
const prisma = require('../utils/prisma')

const socialValidator = (id) =>
  yup.object({
    name: yup
      .string()
      .required('Name is required')
      .test('unique', 'This name already exist', async (value) => {
        const social = await prisma.social.findUnique({
          where: {
            name: value,
          },
        })

        if (social && !id) {
          return false
        }

        if (social && id) {
          if (social.id === id) {
            return true
          } else {
            return false
          }
        }

        if (!social) {
          return true
        }
      }),
    image: yup.string().optional(),
    link: yup.string().url().optional(),
    visibility: yup.bool().default(true),
  })

const socialImageValidator = () =>
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

module.exports = { socialValidator, socialImageValidator }
